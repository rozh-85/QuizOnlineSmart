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
