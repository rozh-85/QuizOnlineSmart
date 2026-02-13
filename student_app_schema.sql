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
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- Messages Policies
DROP POLICY IF EXISTS "Users view relevant messages" ON public.lecture_question_messages;
CREATE POLICY "Users view relevant messages" ON public.lecture_question_messages 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM lecture_questions 
        WHERE id = question_id AND (student_id = auth.uid() OR is_published = true)
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
);

DROP POLICY IF EXISTS "Users can send messages" ON public.lecture_question_messages;
CREATE POLICY "Users can send messages" ON public.lecture_question_messages 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM lecture_questions 
        WHERE id = question_id AND student_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
);

-- ============================================
-- 4. REAL-TIME REPLICATION
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_students;
