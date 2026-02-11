-- Run this in your Supabase SQL Editor to fix the missing column error

-- Add is_read column if it doesn't exist
ALTER TABLE lecture_questions 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Add updated_at if not exists
ALTER TABLE lecture_questions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Ensure RLS is disabled as requested
ALTER TABLE lecture_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_question_messages DISABLE ROW LEVEL SECURITY;
