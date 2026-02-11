-- Consolidated Database Schema for Quiz Application
-- This script sets up the entire database from scratch.

-- ============================================
-- 1. BASE SETUP & EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. TABLES
-- ============================================

-- PROFILES: Stores user profile information, linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('teacher', 'student', 'admin')) DEFAULT 'student',
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
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );
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

-- Profiles: Users can see their own profile, admins see all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Lectures: Everyone can view, teachers can manage
CREATE POLICY "Public Lectures Access" ON public.lectures FOR SELECT USING (true);
CREATE POLICY "Teachers can manage lectures" ON public.lectures FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- Questions: Everyone can view, teachers can manage
CREATE POLICY "Public Questions Access" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Teachers can manage questions" ON public.questions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- Quiz Sessions: Students can manage their own, teachers can view
CREATE POLICY "Students manage own sessions" ON public.quiz_sessions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers view all sessions" ON public.quiz_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- Quiz Answers: Related to sessions
CREATE POLICY "Students manage own answers" ON public.quiz_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM quiz_sessions WHERE id = session_id AND student_id = auth.uid())
);

-- Lecture Materials: Everyone can view, teachers can manage
CREATE POLICY "Public Materials Access" ON public.lecture_materials FOR SELECT USING (true);
CREATE POLICY "Teachers can manage materials" ON public.lecture_materials FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

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
