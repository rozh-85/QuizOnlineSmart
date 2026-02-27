-- Fix: markAsRead returns no rows because RLS is blocking the UPDATE
-- Run this in your Supabase Dashboard → SQL Editor

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
