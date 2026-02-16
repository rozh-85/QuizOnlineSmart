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
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

DROP POLICY IF EXISTS "Teachers can delete messages" ON public.lecture_question_messages;
CREATE POLICY "Teachers can delete messages" ON public.lecture_question_messages 
FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);
