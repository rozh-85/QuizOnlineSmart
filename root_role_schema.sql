-- Root Role + Managed Account Migration
-- Run this in Supabase SQL Editor for an existing QuizOnlineSmart database.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('root', 'teacher', 'student', 'admin'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS serial_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS last_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS device_lock_active BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Staff can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Root and admins can manage profiles" ON public.profiles;

CREATE POLICY "Staff can view profiles" ON public.profiles FOR SELECT USING (
  current_profile_role() IN ('root', 'teacher', 'admin')
);

CREATE POLICY "Root and admins can manage profiles" ON public.profiles FOR ALL
  USING (
    current_profile_role() = 'root'
    OR (current_profile_role() = 'admin' AND role NOT IN ('root', 'admin'))
  )
  WITH CHECK (
    current_profile_role() = 'root'
    OR (current_profile_role() = 'admin' AND role IN ('teacher', 'student'))
  );

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles',
    'lectures',
    'questions',
    'quiz_sessions',
    'quiz_answers',
    'lecture_materials',
    'classes',
    'class_students',
    'lecture_questions',
    'lecture_question_messages',
    'attendance_sessions',
    'attendance_records',
    'attendance_tokens',
    'exam_settings',
    'whats_new_items'
  ]
  LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "Root can manage %I" ON public.%I', table_name, table_name);
      EXECUTE format(
        'CREATE POLICY "Root can manage %I" ON public.%I FOR ALL USING (public.current_profile_role() = %L) WITH CHECK (public.current_profile_role() = %L)',
        table_name,
        table_name,
        'root',
        'root'
      );
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.create_managed_account(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT,
  user_role TEXT,
  user_serial_id TEXT DEFAULT NULL,
  user_pin TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, auth, public
AS $$
DECLARE
  new_user_id UUID := uuid_generate_v4();
  created_profile public.profiles;
  actor_role TEXT := public.current_profile_role();
BEGIN
  IF actor_role NOT IN ('root', 'admin', 'teacher') THEN
    RAISE EXCEPTION 'Only staff accounts can create users';
  END IF;

  IF user_role NOT IN ('root', 'admin', 'teacher', 'student') THEN
    RAISE EXCEPTION 'Invalid role: %', user_role;
  END IF;

  IF actor_role = 'teacher' AND user_role <> 'student' THEN
    RAISE EXCEPTION 'Teachers can only create student accounts';
  END IF;

  IF actor_role <> 'root' AND user_role IN ('root', 'admin') THEN
    RAISE EXCEPTION 'Only root can create root or admin accounts';
  END IF;

  IF LENGTH(COALESCE(user_password, '')) < 4 THEN
    RAISE EXCEPTION 'Password must be at least 4 characters';
  END IF;

  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    confirmation_token,
    recovery_token
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    LOWER(TRIM(user_email)),
    extensions.crypt(user_password, extensions.gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'full_name', user_full_name,
      'role', user_role,
      'serial_id', NULLIF(user_serial_id, ''),
      'pin', COALESCE(NULLIF(user_pin, ''), user_password)
    ),
    'authenticated',
    'authenticated',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    uuid_generate_v4(),
    new_user_id,
    jsonb_build_object('sub', new_user_id::TEXT, 'email', LOWER(TRIM(user_email))),
    'email',
    new_user_id::TEXT,
    NOW(),
    NOW(),
    NOW()
  );

  INSERT INTO public.profiles (id, email, full_name, role, serial_id, pin_display)
  VALUES (
    new_user_id,
    LOWER(TRIM(user_email)),
    user_full_name,
    user_role,
    CASE WHEN user_role = 'student' THEN NULLIF(user_serial_id, '') ELSE NULL END,
    CASE WHEN user_role = 'student' THEN COALESCE(NULLIF(user_pin, ''), user_password) ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    serial_id = EXCLUDED.serial_id,
    pin_display = EXCLUDED.pin_display,
    updated_at = NOW()
  RETURNING * INTO created_profile;

  RETURN created_profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_managed_account(
  target_user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_role TEXT,
  user_serial_id TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  updated_profile public.profiles;
  target_role TEXT;
  actor_role TEXT := public.current_profile_role();
BEGIN
  SELECT role INTO target_role FROM public.profiles WHERE id = target_user_id;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF actor_role NOT IN ('root', 'admin') THEN
    RAISE EXCEPTION 'Only root and admin accounts can update users';
  END IF;

  IF user_role NOT IN ('root', 'admin', 'teacher', 'student') THEN
    RAISE EXCEPTION 'Invalid role: %', user_role;
  END IF;

  IF actor_role <> 'root' AND (target_role IN ('root', 'admin') OR user_role IN ('root', 'admin')) THEN
    RAISE EXCEPTION 'Only root can manage root or admin accounts';
  END IF;

  UPDATE auth.users
  SET
    email = LOWER(TRIM(user_email)),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('full_name', user_full_name, 'role', user_role),
    updated_at = NOW()
  WHERE id = target_user_id;

  UPDATE auth.identities
  SET
    identity_data = COALESCE(identity_data, '{}'::jsonb)
      || jsonb_build_object('email', LOWER(TRIM(user_email))),
    updated_at = NOW()
  WHERE user_id = target_user_id AND provider = 'email';

  UPDATE public.profiles
  SET
    email = LOWER(TRIM(user_email)),
    full_name = user_full_name,
    role = user_role,
    serial_id = CASE WHEN user_role = 'student' THEN NULLIF(user_serial_id, '') ELSE NULL END,
    updated_at = NOW()
  WHERE id = target_user_id
  RETURNING * INTO updated_profile;

  RETURN updated_profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_managed_account(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  target_role TEXT;
  actor_role TEXT := public.current_profile_role();
BEGIN
  SELECT role INTO target_role FROM public.profiles WHERE id = target_user_id;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete the account you are currently using';
  END IF;

  IF actor_role NOT IN ('root', 'admin', 'teacher') THEN
    RAISE EXCEPTION 'Only staff accounts can delete users';
  END IF;

  IF actor_role = 'teacher' AND target_role <> 'student' THEN
    RAISE EXCEPTION 'Teachers can only delete student accounts';
  END IF;

  IF actor_role <> 'root' AND target_role IN ('root', 'admin') THEN
    RAISE EXCEPTION 'Only root can delete root or admin accounts';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_user_password(target_user_id UUID, new_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, auth, public
AS $$
BEGIN
  IF LENGTH(new_password) < 4 THEN
    RAISE EXCEPTION 'Password must be at least 4 characters';
  END IF;

  IF public.current_profile_role() NOT IN ('root', 'admin', 'teacher') THEN
    RAISE EXCEPTION 'Only staff accounts can change passwords';
  END IF;

  IF public.current_profile_role() = 'teacher'
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = target_user_id AND role = 'student'
     ) THEN
    RAISE EXCEPTION 'Teachers can only change student passwords';
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
    updated_at = NOW()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_managed_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_managed_account(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_managed_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_password(UUID, TEXT) TO authenticated;

-- Bootstrap after running this migration:
-- UPDATE public.profiles SET role = 'root' WHERE email = 'your-trusted-admin@example.com';
