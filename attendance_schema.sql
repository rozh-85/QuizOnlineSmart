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
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
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
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
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
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- Students can read tokens (needed for verification)
DROP POLICY IF EXISTS "Students can read tokens" ON public.attendance_tokens;
CREATE POLICY "Students can read tokens" ON public.attendance_tokens
FOR SELECT USING (true);

-- ============================================
-- 7. REAL-TIME REPLICATION
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_tokens;

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
