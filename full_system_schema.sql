-- =====================================================
-- Combined Database Schema for QuizOnlineSmart
-- =====================================================
-- This file combines the app schema, follow-up migrations, RLS fixes,
-- root-role account-management functions, attendance, Q&A, reports,
-- exam settings, lecture materials, and what's-new publisher tables.
--
-- seed_data.sql is intentionally not included here because it inserts
-- sample/demo data. Run it separately only when you want seeded content.
-- =====================================================

-- Drop known policies/triggers first so this combined schema can be
-- safely re-run on a database that already has earlier schema pieces.
DO $$
DECLARE
  policy_rec RECORD;
  trigger_rec RECORD;
BEGIN
  FOR policy_rec IN SELECT * FROM (VALUES
    ('storage', 'objects', 'Public Upload'),
    ('storage', 'objects', 'Public Select'),
    ('storage', 'objects', 'Public Update'),
    ('storage', 'objects', 'Public Delete'),
    ('public', 'profiles', 'Users can view own profile'),
    ('public', 'profiles', 'Staff can view profiles'),
    ('public', 'profiles', 'Users can update own profile'),
    ('public', 'profiles', 'Root and admins can manage profiles'),
    ('public', 'profiles', 'Root can manage profiles'),
    ('public', 'lectures', 'Public Lectures Access'),
    ('public', 'lectures', 'Teachers can manage lectures'),
    ('public', 'lectures', 'Root can manage lectures'),
    ('public', 'questions', 'Public Questions Access'),
    ('public', 'questions', 'Teachers can manage questions'),
    ('public', 'questions', 'Root can manage questions'),
    ('public', 'quiz_sessions', 'Students manage own sessions'),
    ('public', 'quiz_sessions', 'Teachers view all sessions'),
    ('public', 'quiz_sessions', 'Root can manage quiz_sessions'),
    ('public', 'quiz_answers', 'Students manage own answers'),
    ('public', 'quiz_answers', 'Root can manage quiz_answers'),
    ('public', 'lecture_materials', 'Public Materials Access'),
    ('public', 'lecture_materials', 'Teachers can manage materials'),
    ('public', 'lecture_materials', 'Public All Materials Access'),
    ('public', 'lecture_materials', 'Root can manage lecture_materials'),
    ('public', 'lecture_questions', 'Students see own or published questions'),
    ('public', 'lecture_questions', 'Students can create questions'),
    ('public', 'lecture_questions', 'Teachers manage all questions'),
    ('public', 'lecture_questions', 'Students can update their own questions'),
    ('public', 'lecture_questions', 'Students can read their own questions'),
    ('public', 'lecture_questions', 'Anyone can update questions'),
    ('public', 'lecture_questions', 'Root can manage lecture_questions'),
    ('public', 'lecture_question_messages', 'Users view relevant messages'),
    ('public', 'lecture_question_messages', 'Users can send messages'),
    ('public', 'lecture_question_messages', 'Sender can update own messages'),
    ('public', 'lecture_question_messages', 'Sender can delete own messages'),
    ('public', 'lecture_question_messages', 'Teachers can update messages'),
    ('public', 'lecture_question_messages', 'Teachers can delete messages'),
    ('public', 'lecture_question_messages', 'Root can manage lecture_question_messages'),
    ('public', 'classes', 'Root can manage classes'),
    ('public', 'class_students', 'Root can manage class_students'),
    ('public', 'attendance_sessions', 'Teachers manage attendance sessions'),
    ('public', 'attendance_sessions', 'Students view own sessions'),
    ('public', 'attendance_sessions', 'Students view own class sessions'),
    ('public', 'attendance_sessions', 'Owner manages sessions'),
    ('public', 'attendance_sessions', 'Students view class sessions'),
    ('public', 'attendance_sessions', 'Root can manage attendance_sessions'),
    ('public', 'attendance_records', 'Teachers manage attendance records'),
    ('public', 'attendance_records', 'Students view own records'),
    ('public', 'attendance_records', 'Students can join attendance'),
    ('public', 'attendance_records', 'Session owner manages records'),
    ('public', 'attendance_records', 'Root can manage attendance_records'),
    ('public', 'attendance_tokens', 'Teachers manage tokens'),
    ('public', 'attendance_tokens', 'Students can read tokens'),
    ('public', 'attendance_tokens', 'Anyone can read tokens'),
    ('public', 'attendance_tokens', 'Session owner manages tokens'),
    ('public', 'attendance_tokens', 'Authenticated read tokens'),
    ('public', 'attendance_tokens', 'Root can manage attendance_tokens'),
    ('public', 'exam_settings', 'Authenticated users can view exam_settings'),
    ('public', 'exam_settings', 'Authenticated users can insert exam_settings'),
    ('public', 'exam_settings', 'Authenticated users can update exam_settings'),
    ('public', 'exam_settings', 'Authenticated users can delete exam_settings'),
    ('public', 'exam_settings', 'Root can manage exam_settings'),
    ('public', 'whats_new_items', 'Teachers can insert whats_new_items'),
    ('public', 'whats_new_items', 'Teachers can select whats_new_items'),
    ('public', 'whats_new_items', 'Teachers can update whats_new_items'),
    ('public', 'whats_new_items', 'Teachers can delete whats_new_items'),
    ('public', 'whats_new_items', 'Root can manage whats_new_items')
  ) AS v(schema_name, table_name, policy_name)
  LOOP
    IF to_regclass(format('%I.%I', policy_rec.schema_name, policy_rec.table_name)) IS NOT NULL THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I.%I',
        policy_rec.policy_name,
        policy_rec.schema_name,
        policy_rec.table_name
      );
    END IF;
  END LOOP;

  FOR trigger_rec IN SELECT * FROM (VALUES
    ('public', 'profiles', 'update_profiles_updated_at'),
    ('public', 'lectures', 'update_lectures_updated_at'),
    ('public', 'questions', 'update_questions_updated_at'),
    ('public', 'lecture_materials', 'update_lecture_materials_updated_at'),
    ('public', 'attendance_sessions', 'update_attendance_sessions_updated_at'),
    ('public', 'attendance_records', 'update_attendance_records_updated_at'),
    ('public', 'exam_settings', 'update_exam_settings_updated_at'),
    ('auth', 'users', 'on_auth_user_created')
  ) AS v(schema_name, table_name, trigger_name)
  LOOP
    IF to_regclass(format('%I.%I', trigger_rec.schema_name, trigger_rec.table_name)) IS NOT NULL THEN
      EXECUTE format(
        'DROP TRIGGER IF EXISTS %I ON %I.%I',
        trigger_rec.trigger_name,
        trigger_rec.schema_name,
        trigger_rec.table_name
      );
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- Source: full_system_schema.sql
-- =====================================================
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


-- =====================================================
-- Source: lecture_qa_schema.sql
-- =====================================================
-- Lecture Q&A System Schema (BYPASS AUTH VERSION)

-- 1. Create Question Threads table
-- Removed REFERENCES auth.users for student_id to allow testing without login
CREATE TABLE IF NOT EXISTS lecture_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
    student_id UUID, -- Removed foreign key to auth.users
    question_text TEXT NOT NULL,
    official_answer TEXT,
    is_published BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false, -- Notification tracking for admins
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Messages table for threads
-- Removed REFERENCES auth.users for sender_id to allow testing without login
CREATE TABLE IF NOT EXISTS lecture_question_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES lecture_questions(id) ON DELETE CASCADE,
    sender_id UUID, -- Removed foreign key to auth.users
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. DISABLE RLS (As requested: "ignore the role and all this login remove")
ALTER TABLE lecture_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_question_messages DISABLE ROW LEVEL SECURITY;

-- 4. Indices for performance
CREATE INDEX IF NOT EXISTS idx_lecture_questions_lecture_id ON lecture_questions(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_questions_student_id ON lecture_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_lecture_question_messages_question_id ON lecture_question_messages(question_id);


-- =====================================================
-- Source: fix_qa_schema.sql
-- =====================================================
-- 1. Add missing columns to lecture_questions
ALTER TABLE lecture_questions
ADD COLUMN IF NOT EXISTS is_read_by_student BOOLEAN DEFAULT true;

-- 2. Add missing image_url column to messages
ALTER TABLE lecture_question_messages
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Ensure updated_at exists
ALTER TABLE lecture_questions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 4. Disable RLS for prototype testing (OR update policies to allow anon)
-- To allow teacher panel to work without real Supabase Auth:
ALTER TABLE lecture_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_question_messages DISABLE ROW LEVEL SECURITY;


-- =====================================================
-- Source: student_app_schema.sql
-- =====================================================
-- Database Schema Updates for Student-Teacher Q&A Web App

-- ============================================
-- 1. TABLES FOR CLASS SYSTEM
-- ============================================

-- CLASSES: Each teacher can create multiple classes
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLASS_STUDENTS: Junction table for students assigned to classes
CREATE TABLE IF NOT EXISTS public.class_students (
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, student_id)
);

-- ============================================
-- 2. PROFILE UPDATES FOR STUDENTS & DEVICE LOCK
-- ============================================

-- ADD NECESSARY COLUMNS TO PROFILES
-- serial_id: unique student code
-- last_fingerprint: current device token/fingerprint
-- device_lock_active: whether the account is currently locked to a device
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS serial_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS last_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS device_lock_active BOOLEAN DEFAULT false;

-- ============================================
-- 3. Q&A SYSTEM UPDATES (RLS & PRIVACY)
-- ============================================

-- Re-enable RLS on lecture_questions if it was disabled
ALTER TABLE public.lecture_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_question_messages ENABLE ROW LEVEL SECURITY;

-- Allow students to view only their own private questions or published questions
DROP POLICY IF EXISTS "Students see own or published questions" ON public.lecture_questions;
CREATE POLICY "Students see own or published questions" ON public.lecture_questions
FOR SELECT USING (
    auth.uid() = student_id OR is_published = true
);

-- Allow students to create questions
DROP POLICY IF EXISTS "Students can create questions" ON public.lecture_questions;
CREATE POLICY "Students can create questions" ON public.lecture_questions
FOR INSERT WITH CHECK (
    auth.uid() = student_id
);

-- Allow teachers to manage all questions
DROP POLICY IF EXISTS "Teachers manage all questions" ON public.lecture_questions;
CREATE POLICY "Teachers manage all questions" ON public.lecture_questions
FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin'))
);

-- Messages Policies
DROP POLICY IF EXISTS "Users view relevant messages" ON public.lecture_question_messages;
CREATE POLICY "Users view relevant messages" ON public.lecture_question_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM lecture_questions
        WHERE id = question_id AND (student_id = auth.uid() OR is_published = true)
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin')
    )
);

DROP POLICY IF EXISTS "Users can send messages" ON public.lecture_question_messages;
CREATE POLICY "Users can send messages" ON public.lecture_question_messages
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM lecture_questions
        WHERE id = question_id AND student_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin')
    )
);

-- ============================================
-- 4. REAL-TIME REPLICATION
-- ============================================


-- =====================================================
-- Source: fix_message_edit_rls.sql
-- =====================================================
-- Fix: Add is_from_teacher column + UPDATE/DELETE policies for lecture_question_messages
-- The is_from_teacher column is needed because teacher and student may share the same
-- Supabase auth session, making sender_id unreliable for distinguishing them.

-- 1. Add is_from_teacher column
ALTER TABLE public.lecture_question_messages
ADD COLUMN IF NOT EXISTS is_from_teacher BOOLEAN DEFAULT false;

-- 2. Allow message sender to update their own messages (covers shared-session scenario)
DROP POLICY IF EXISTS "Sender can update own messages" ON public.lecture_question_messages;
CREATE POLICY "Sender can update own messages" ON public.lecture_question_messages
FOR UPDATE USING (sender_id = auth.uid());

-- 3. Allow message sender to delete their own messages
DROP POLICY IF EXISTS "Sender can delete own messages" ON public.lecture_question_messages;
CREATE POLICY "Sender can delete own messages" ON public.lecture_question_messages
FOR DELETE USING (sender_id = auth.uid());

-- 4. Also allow teachers/admins (with their own session) to update/delete any message
DROP POLICY IF EXISTS "Teachers can update messages" ON public.lecture_question_messages;
CREATE POLICY "Teachers can update messages" ON public.lecture_question_messages
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin'))
);

DROP POLICY IF EXISTS "Teachers can delete messages" ON public.lecture_question_messages;
CREATE POLICY "Teachers can delete messages" ON public.lecture_question_messages
FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin'))
);


-- =====================================================
-- Source: fix_markasread_rls.sql
-- =====================================================
-- Fix: markAsRead returns no rows because RLS is blocking the UPDATE
-- Run this in your Supabase Dashboard â†’ SQL Editor

-- Option A: Disable RLS entirely (simplest, matches your existing schema intent)
ALTER TABLE lecture_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_question_messages DISABLE ROW LEVEL SECURITY;

-- Option B: If you want to keep RLS enabled, add these policies instead:
-- (Only use Option B if you comment out Option A above)

-- DROP POLICY IF EXISTS "Students can update their own questions" ON lecture_questions;
-- CREATE POLICY "Students can update their own questions"
--   ON lecture_questions FOR UPDATE
--   USING (student_id = auth.uid())
--   WITH CHECK (student_id = auth.uid());

-- DROP POLICY IF EXISTS "Students can read their own questions" ON lecture_questions;
-- CREATE POLICY "Students can read their own questions"
--   ON lecture_questions FOR SELECT
--   USING (true);

-- DROP POLICY IF EXISTS "Anyone can update questions" ON lecture_questions;
-- CREATE POLICY "Anyone can update questions"
--   ON lecture_questions FOR UPDATE
--   USING (true)
--   WITH CHECK (true);


-- =====================================================
-- Source: lecture_materials_schema.sql
-- =====================================================
-- ============================================
-- 1. Create the lecture_materials table
-- ============================================
CREATE TABLE IF NOT EXISTS public.lecture_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT CHECK (file_type IN ('note', 'pdf', 'word')),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  section_id TEXT,
  teacher_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. PUBLIC ACCESS FOR TESTING (Prototype Only)
-- ============================================
-- This fixes "new row violates row-level security policy"
ALTER TABLE public.lecture_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public All Materials Access" ON public.lecture_materials;
CREATE POLICY "Public All Materials Access" ON public.lecture_materials FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 3. STORAGE BUCKET & POLICIES (Critical for Uploads)
-- ============================================
-- 1. Create the 'materials' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies (Allow Public Uploads for Testing)
-- This fixes "Bucket not found" if bucket exists but policy is missing
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials');

DROP POLICY IF EXISTS "Public Select" ON storage.objects;
CREATE POLICY "Public Select" ON storage.objects FOR SELECT USING (bucket_id = 'materials');

DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'materials');

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'materials');

-- ============================================
-- 4. REAL-TIME REPLICATION
-- ============================================


-- =====================================================
-- Source: attendance_schema.sql
-- =====================================================
-- ============================================
-- ATTENDANCE SYSTEM SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. ATTENDANCE SESSIONS
-- ============================================
-- Each session represents one class meeting (e.g. "Grade 10-A on 2025-02-17")
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('pending', 'active', 'completed')) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ATTENDANCE RECORDS
-- ============================================
-- Each record tracks one student's attendance within a session
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    time_joined TIMESTAMP WITH TIME ZONE,
    time_left TIMESTAMP WITH TIME ZONE,
    hours_attended NUMERIC(5, 2) DEFAULT 0,
    status TEXT CHECK (status IN ('present', 'removed')) DEFAULT 'present',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- ============================================
-- 3. ATTENDANCE TOKENS
-- ============================================
-- Short-lived tokens embedded in QR codes; refresh every 2 seconds
CREATE TABLE IF NOT EXISTS public.attendance_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ============================================
-- 4. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class ON public.attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher ON public.attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON public.attendance_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_tokens_session ON public.attendance_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_tokens_token ON public.attendance_tokens(token);

-- ============================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER update_attendance_sessions_updated_at
    BEFORE UPDATE ON public.attendance_sessions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
    BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_tokens ENABLE ROW LEVEL SECURITY;

-- Teachers can manage all attendance sessions
DROP POLICY IF EXISTS "Teachers manage attendance sessions" ON public.attendance_sessions;
CREATE POLICY "Teachers manage attendance sessions" ON public.attendance_sessions
FOR ALL
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin'))
);

-- Students can only view sessions for classes they belong to
DROP POLICY IF EXISTS "Students view own class sessions" ON public.attendance_sessions;
CREATE POLICY "Students view own class sessions" ON public.attendance_sessions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM class_students
        WHERE class_students.class_id = attendance_sessions.class_id
          AND class_students.student_id = auth.uid()
    )
);

-- Teachers can manage all attendance records
DROP POLICY IF EXISTS "Teachers manage attendance records" ON public.attendance_records;
CREATE POLICY "Teachers manage attendance records" ON public.attendance_records
FOR ALL
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin'))
);

-- Students can view their own attendance records
DROP POLICY IF EXISTS "Students view own records" ON public.attendance_records;
CREATE POLICY "Students view own records" ON public.attendance_records
FOR SELECT USING (student_id = auth.uid());

-- Students can insert their own record ONLY if they belong to that class
DROP POLICY IF EXISTS "Students can join attendance" ON public.attendance_records;
CREATE POLICY "Students can join attendance" ON public.attendance_records
FOR INSERT WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM class_students
        WHERE class_students.class_id = attendance_records.class_id
          AND class_students.student_id = auth.uid()
    )
);

-- Teachers can manage tokens
DROP POLICY IF EXISTS "Teachers manage tokens" ON public.attendance_tokens;
CREATE POLICY "Teachers manage tokens" ON public.attendance_tokens
FOR ALL
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('root', 'teacher', 'admin'))
);

-- Students can read tokens (needed for verification)
DROP POLICY IF EXISTS "Students can read tokens" ON public.attendance_tokens;
CREATE POLICY "Students can read tokens" ON public.attendance_tokens
FOR SELECT USING (true);

-- ============================================
-- 7. REAL-TIME REPLICATION
-- ============================================

-- ============================================
-- 8. VERIFY TOKEN & JOIN RPC FUNCTION
-- ============================================
-- Atomic function: verify token + insert attendance record in one call
CREATE OR REPLACE FUNCTION public.verify_and_join_attendance(
    p_token TEXT,
    p_student_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_token_row RECORD;
    v_session_row RECORD;
    v_record_exists BOOLEAN;
    v_class_student_exists BOOLEAN;
    v_student_profile RECORD;
BEGIN
    -- 0. Verify the student exists and is actually a student
    SELECT * INTO v_student_profile
    FROM public.profiles
    WHERE id = p_student_id AND role = 'student';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Only students can record attendance');
    END IF;

    -- 1. Find the token
    SELECT * INTO v_token_row
    FROM public.attendance_tokens
    WHERE token = p_token
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid QR code');
    END IF;

    -- 2. Check token is active
    IF NOT v_token_row.is_active THEN
        RETURN json_build_object('success', false, 'error', 'QR code is no longer active');
    END IF;

    -- 3. Check token is not expired
    IF v_token_row.expires_at < NOW() THEN
        RETURN json_build_object('success', false, 'error', 'QR code has expired');
    END IF;

    -- 4. Get the session
    SELECT * INTO v_session_row
    FROM public.attendance_sessions
    WHERE id = v_token_row.session_id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Session not found');
    END IF;

    -- 5. Check session is active
    IF v_session_row.status != 'active' THEN
        RETURN json_build_object('success', false, 'error', 'Session is not active');
    END IF;

    -- 6. Check student belongs to the class
    SELECT EXISTS (
        SELECT 1 FROM public.class_students
        WHERE class_id = v_session_row.class_id AND student_id = p_student_id
    ) INTO v_class_student_exists;

    IF NOT v_class_student_exists THEN
        RETURN json_build_object('success', false, 'error', 'You are not enrolled in this class');
    END IF;

    -- 7. Check if student already has an active record
    SELECT EXISTS (
        SELECT 1 FROM public.attendance_records
        WHERE session_id = v_session_row.id
          AND student_id = p_student_id
          AND status = 'present'
    ) INTO v_record_exists;

    IF v_record_exists THEN
        RETURN json_build_object('success', true, 'message', 'Already marked as present');
    END IF;

    -- 8. Insert attendance record
    INSERT INTO public.attendance_records (session_id, student_id, class_id, time_joined, status)
    VALUES (v_session_row.id, p_student_id, v_session_row.class_id, NOW(), 'present')
    ON CONFLICT (session_id, student_id) DO UPDATE SET
        status = 'present',
        time_joined = NOW(),
        time_left = NULL,
        hours_attended = 0;

    RETURN json_build_object(
        'success', true,
        'message', 'Attendance recorded',
        'session_id', v_session_row.id,
        'class_id', v_session_row.class_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Source: fix_attendance_rls.sql
-- =====================================================
-- ============================================
-- FIX: Attendance RLS Policies  (v3)
-- Run this in Supabase SQL Editor
-- ============================================
-- Uses ONLY direct column comparisons.
-- No profiles table queries. No JWT metadata lookups.
-- attendance_sessions  â†’ teacher_id = auth.uid()
-- attendance_records   â†’ join through attendance_sessions
-- attendance_tokens    â†’ join through attendance_sessions
-- Student writes go through SECURITY DEFINER RPC (bypasses RLS).

-- ============================================
-- 1. NUKE all existing policies
-- ============================================
DROP POLICY IF EXISTS "Teachers manage attendance sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Students view own sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Students view own class sessions" ON public.attendance_sessions;

DROP POLICY IF EXISTS "Teachers manage attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Students view own records" ON public.attendance_records;
DROP POLICY IF EXISTS "Students can join attendance" ON public.attendance_records;

DROP POLICY IF EXISTS "Teachers manage tokens" ON public.attendance_tokens;
DROP POLICY IF EXISTS "Students can read tokens" ON public.attendance_tokens;
DROP POLICY IF EXISTS "Anyone can read tokens" ON public.attendance_tokens;

-- ============================================
-- 2. attendance_sessions
-- ============================================

-- Teacher who owns the session: full CRUD
-- teacher_id is set to auth.uid() on INSERT, so WITH CHECK passes
CREATE POLICY "Owner manages sessions" ON public.attendance_sessions
FOR ALL
USING  (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Students: read-only for classes they belong to
CREATE POLICY "Students view class sessions" ON public.attendance_sessions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM class_students cs
        WHERE cs.class_id = attendance_sessions.class_id
          AND cs.student_id = auth.uid()
    )
);

-- ============================================
-- 3. attendance_records
-- ============================================

-- Teacher who owns the parent session: full CRUD
CREATE POLICY "Session owner manages records" ON public.attendance_records
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM attendance_sessions s
        WHERE s.id = attendance_records.session_id
          AND s.teacher_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM attendance_sessions s
        WHERE s.id = attendance_records.session_id
          AND s.teacher_id = auth.uid()
    )
);

-- Students: read their own records only
CREATE POLICY "Students view own records" ON public.attendance_records
FOR SELECT USING (student_id = auth.uid());

-- NOTE: Student INSERT is handled by the SECURITY DEFINER RPC function
-- (verify_and_join_attendance), which bypasses RLS entirely.

-- ============================================
-- 4. attendance_tokens
-- ============================================

-- Teacher who owns the parent session: full CRUD
CREATE POLICY "Session owner manages tokens" ON public.attendance_tokens
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM attendance_sessions s
        WHERE s.id = attendance_tokens.session_id
          AND s.teacher_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM attendance_sessions s
        WHERE s.id = attendance_tokens.session_id
          AND s.teacher_id = auth.uid()
    )
);

-- Tokens are verified inside SECURITY DEFINER RPC, but allow read for all authenticated
CREATE POLICY "Authenticated read tokens" ON public.attendance_tokens
FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================
-- 5. REPLACE RPC function (SECURITY DEFINER â€” bypasses all RLS)
-- ============================================
CREATE OR REPLACE FUNCTION public.verify_and_join_attendance(
    p_token TEXT,
    p_student_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_token_row RECORD;
    v_session_row RECORD;
    v_record_exists BOOLEAN;
    v_class_student_exists BOOLEAN;
    v_student_profile RECORD;
BEGIN
    -- 0. Verify the student exists and is actually a student
    SELECT * INTO v_student_profile
    FROM public.profiles
    WHERE id = p_student_id AND role = 'student';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Only students can record attendance');
    END IF;

    -- 1. Find the token
    SELECT * INTO v_token_row
    FROM public.attendance_tokens
    WHERE token = p_token
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid QR code');
    END IF;

    -- 2. Check token is active
    IF NOT v_token_row.is_active THEN
        RETURN json_build_object('success', false, 'error', 'QR code is no longer active');
    END IF;

    -- 3. Check token is not expired
    IF v_token_row.expires_at < NOW() THEN
        RETURN json_build_object('success', false, 'error', 'QR code has expired');
    END IF;

    -- 4. Get the session
    SELECT * INTO v_session_row
    FROM public.attendance_sessions
    WHERE id = v_token_row.session_id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Session not found');
    END IF;

    -- 5. Check session is active
    IF v_session_row.status != 'active' THEN
        RETURN json_build_object('success', false, 'error', 'Session is not active');
    END IF;

    -- 6. Check student belongs to the class
    SELECT EXISTS (
        SELECT 1 FROM public.class_students
        WHERE class_id = v_session_row.class_id AND student_id = p_student_id
    ) INTO v_class_student_exists;

    IF NOT v_class_student_exists THEN
        RETURN json_build_object('success', false, 'error', 'You are not enrolled in this class');
    END IF;

    -- 7. Check if student already has an active record
    SELECT EXISTS (
        SELECT 1 FROM public.attendance_records
        WHERE session_id = v_session_row.id
          AND student_id = p_student_id
          AND status = 'present'
    ) INTO v_record_exists;

    IF v_record_exists THEN
        RETURN json_build_object('success', true, 'message', 'Already marked as present');
    END IF;

    -- 8. Insert attendance record
    INSERT INTO public.attendance_records (session_id, student_id, class_id, time_joined, status)
    VALUES (v_session_row.id, p_student_id, v_session_row.class_id, NOW(), 'present')
    ON CONFLICT (session_id, student_id) DO UPDATE SET
        status = 'present',
        time_joined = NOW(),
        time_left = NULL,
        hours_attended = 0;

    RETURN json_build_object(
        'success', true,
        'message', 'Attendance recorded',
        'session_id', v_session_row.id,
        'class_id', v_session_row.class_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- Source: reports_migration.sql
-- =====================================================
-- ============================================
-- REPORTS MIGRATION
-- ============================================
-- Adds lecture_id to attendance_sessions for reporting/filtering
-- Run this in Supabase SQL Editor BEFORE using the Reports page

ALTER TABLE public.attendance_sessions
ADD COLUMN IF NOT EXISTS lecture_id UUID REFERENCES public.lectures(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_lecture ON public.attendance_sessions(lecture_id);


-- =====================================================
-- Source: exam_settings_schema.sql
-- =====================================================
-- Exam Settings Table: Persists exam header/footer preferences
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.exam_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES public.profiles(id),
  subject TEXT DEFAULT '',
  department TEXT DEFAULT '',
  college TEXT DEFAULT '',
  date TEXT DEFAULT '',
  time_allowed TEXT DEFAULT '',
  header_enabled BOOLEAN DEFAULT true,
  footer_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updated_at trigger
CREATE TRIGGER update_exam_settings_updated_at
  BEFORE UPDATE ON public.exam_settings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS
ALTER TABLE public.exam_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage exam settings
CREATE POLICY "Authenticated users can view exam_settings"
  ON public.exam_settings FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert exam_settings"
  ON public.exam_settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update exam_settings"
  ON public.exam_settings FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete exam_settings"
  ON public.exam_settings FOR DELETE USING (true);


-- =====================================================
-- Source: whats_new_schema.sql
-- =====================================================
-- =====================================================
-- What's New Publisher Schema
-- =====================================================

-- Table to track pending/published/declined "what's new" items
create table if not exists whats_new_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('lecture', 'material', 'question')),
  lecture_id uuid references lectures(id) on delete cascade,
  reference_id uuid not null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'published', 'declined')),
  teacher_id uuid references auth.users(id),
  created_at timestamptz default now(),
  published_at timestamptz
);

-- Index for fast lookups by status
create index if not exists idx_whats_new_status on whats_new_items(status);
create index if not exists idx_whats_new_lecture on whats_new_items(lecture_id, item_type, status);

-- RLS policies
alter table whats_new_items enable row level security;

-- Teachers can insert their own items
create policy "Teachers can insert whats_new_items"
  on whats_new_items for insert
  with check (auth.uid() = teacher_id);

-- Teachers can view all items they created
create policy "Teachers can select whats_new_items"
  on whats_new_items for select
  using (auth.uid() = teacher_id or status = 'published');

-- Teachers can update their own items
create policy "Teachers can update whats_new_items"
  on whats_new_items for update
  using (auth.uid() = teacher_id);

-- Teachers can delete their own items
create policy "Teachers can delete whats_new_items"
  on whats_new_items for delete
  using (auth.uid() = teacher_id);


-- =====================================================
-- Source: fix_whats_new_manual.sql
-- =====================================================
-- =====================================================
-- Allow 'manual' item_type in whats_new_items
-- =====================================================

-- 1. Drop the existing CHECK constraint on item_type
ALTER TABLE whats_new_items
  DROP CONSTRAINT IF EXISTS whats_new_items_item_type_check;

-- 2. Re-add with 'manual' included
ALTER TABLE whats_new_items
  ADD CONSTRAINT whats_new_items_item_type_check
  CHECK (item_type IN ('lecture', 'material', 'question', 'manual'));


-- =====================================================
-- Source: change_password_schema.sql
-- =====================================================
-- =====================================================
-- Change User Password Function
-- =====================================================
-- This function allows root/admin/teacher accounts to change managed user
-- auth password via RPC. It uses SECURITY DEFINER to run
-- with elevated privileges so only the function (not the caller)
-- needs direct access to auth.users.
--
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =====================================================

-- Enable pgcrypto if not already enabled (needed for crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Create or replace the function
CREATE OR REPLACE FUNCTION change_user_password(target_user_id UUID, new_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, auth, public
AS $$
BEGIN
  -- Validate password length
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

  -- Update the password in auth.users
  UPDATE auth.users
  SET
    encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
    updated_at = now()
  WHERE id = target_user_id;

  -- Check if user was found
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users (authorization is checked in the function)
GRANT EXECUTE ON FUNCTION change_user_password(UUID, TEXT) TO authenticated;


-- =====================================================
-- Source: root_role_schema.sql
-- =====================================================
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


-- =====================================================
-- Final Realtime Publication Setup
-- =====================================================
-- The source files used direct ALTER PUBLICATION statements. In the
-- combined schema, make this idempotent so the script does not fail if
-- a table is already part of supabase_realtime.
DO $$
DECLARE
  table_name TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RETURN;
  END IF;

  FOREACH table_name IN ARRAY ARRAY[
    'lectures',
    'questions',
    'lecture_materials',
    'lecture_questions',
    'lecture_question_messages',
    'classes',
    'class_students',
    'attendance_sessions',
    'attendance_records',
    'attendance_tokens'
  ]
  LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM pg_publication_rel pr
         JOIN pg_publication p ON p.oid = pr.prpubid
         WHERE p.pubname = 'supabase_realtime'
           AND pr.prrelid = to_regclass('public.' || table_name)
       ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END $$;
