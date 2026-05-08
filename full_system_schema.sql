-- Consolidated Database Schema for Quiz Application
-- This script sets up the entire database from scratch.

-- ============================================
-- 1. BASE SETUP & EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================
-- 2. TABLES
-- ============================================

-- PROFILES: Stores user profile information, linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('root', 'teacher', 'student', 'admin')) DEFAULT 'student',
  pin_display TEXT, -- To allow teachers to recover forgotten PINs
  serial_id TEXT UNIQUE,
  last_fingerprint TEXT,
  device_lock_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LECTURES: Stores main lecture chapters
CREATE TABLE IF NOT EXISTS public.lectures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  sections TEXT[] DEFAULT '{}',
  teacher_id UUID REFERENCES public.profiles(id),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUESTIONS: Stores questions for each lecture/section
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  type TEXT CHECK (type IN ('multiple-choice', 'true-false', 'blank')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  options TEXT[] DEFAULT '{}',
  correct_index INTEGER,
  correct_answer TEXT,
  explanation TEXT,
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
  section_id TEXT,
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUIZ SESSIONS: Tracks student attempts
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('in_progress', 'completed')) DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUIZ ANSWERS: Tracks specific answers in a session
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  student_answer TEXT,
  is_correct BOOLEAN DEFAULT false,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LECTURE MATERIALS: Stores notes and supplementary files
CREATE TABLE IF NOT EXISTS public.lecture_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT, -- For text notes
  file_url TEXT, -- For uploaded documents
  file_name TEXT,
  file_type TEXT CHECK (file_type IN ('note', 'pdf', 'word')),
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
  section_id TEXT,
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON public.lectures FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_lecture_materials_updated_at BEFORE UPDATE ON public.lecture_materials FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 4. NEW USER PROFILE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, pin_display, serial_id)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'pin', -- Save the PIN for recovery
    new.raw_user_meta_data->>'serial_id' -- Save the Serial ID
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    pin_display = EXCLUDED.pin_display,
    serial_id = EXCLUDED.serial_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_materials ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Profiles: Users can see their own profile; staff can view managed accounts; root/admin can manage them
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Staff can view profiles" ON public.profiles FOR SELECT USING (
  current_profile_role() IN ('root', 'teacher', 'admin')
);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = current_profile_role());
CREATE POLICY "Root and admins can manage profiles" ON public.profiles FOR ALL
  USING (
    current_profile_role() = 'root'
    OR (current_profile_role() = 'admin' AND role NOT IN ('root', 'admin'))
  )
  WITH CHECK (
    current_profile_role() = 'root'
    OR (current_profile_role() = 'admin' AND role IN ('teacher', 'student'))
  );

-- Lectures: Everyone can view, teachers can manage
CREATE POLICY "Public Lectures Access" ON public.lectures FOR SELECT USING (true);
CREATE POLICY "Teachers can manage lectures" ON public.lectures FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin'))
);

-- Questions: Everyone can view, teachers can manage
CREATE POLICY "Public Questions Access" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Teachers can manage questions" ON public.questions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin'))
);

-- Quiz Sessions: Students can manage their own, teachers can view
CREATE POLICY "Students manage own sessions" ON public.quiz_sessions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers view all sessions" ON public.quiz_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin'))
);

-- Quiz Answers: Related to sessions
CREATE POLICY "Students manage own answers" ON public.quiz_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM quiz_sessions WHERE id = session_id AND student_id = auth.uid())
);

-- Lecture Materials: Everyone can view, teachers can manage
CREATE POLICY "Public Materials Access" ON public.lecture_materials FOR SELECT USING (true);
CREATE POLICY "Teachers can manage materials" ON public.lecture_materials FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin'))
);

-- Managed account helpers. These create/update/delete both auth.users and public.profiles.
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

-- ============================================
-- 6. STORAGE BUCKET & PERMISSIVE POLICIES
-- ============================================

-- 1. Create the 'materials' bucket
-- If this fails, create it MANUALLY in the Supabase Dashboard -> Storage tab
INSERT INTO storage.buckets (id, name, public) 
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies (Allow Public Uploads for Prototype Testing)
-- This fixes "Bucket not found" if bucket exists but policy is missing
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials');

DROP POLICY IF EXISTS "Public Select" ON storage.objects;
CREATE POLICY "Public Select" ON storage.objects FOR SELECT USING (bucket_id = 'materials');

DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'materials');

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'materials');

-- 3. Table Policies (Allow Public Access to Materials table)
-- This fixes "new row violates row-level security policy"
DROP POLICY IF EXISTS "Public All Materials Access" ON public.lecture_materials;
CREATE POLICY "Public All Materials Access" ON public.lecture_materials FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 7. REAL-TIME REPLICATION
-- ============================================
-- Enable real-time for all tables to ensure UI updates without refresh
ALTER PUBLICATION supabase_realtime ADD TABLE public.lectures;
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lecture_materials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lecture_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lecture_question_messages;
