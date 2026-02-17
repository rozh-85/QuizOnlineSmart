-- ============================================
-- FIX: Attendance RLS Policies  (v3)
-- Run this in Supabase SQL Editor
-- ============================================
-- Uses ONLY direct column comparisons.
-- No profiles table queries. No JWT metadata lookups.
-- attendance_sessions  → teacher_id = auth.uid()
-- attendance_records   → join through attendance_sessions
-- attendance_tokens    → join through attendance_sessions
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
-- 5. REPLACE RPC function (SECURITY DEFINER — bypasses all RLS)
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
