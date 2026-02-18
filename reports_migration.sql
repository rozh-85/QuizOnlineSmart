-- ============================================
-- REPORTS MIGRATION
-- ============================================
-- Adds lecture_id to attendance_sessions for reporting/filtering
-- Run this in Supabase SQL Editor BEFORE using the Reports page

ALTER TABLE public.attendance_sessions 
ADD COLUMN IF NOT EXISTS lecture_id UUID REFERENCES public.lectures(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_lecture ON public.attendance_sessions(lecture_id);
