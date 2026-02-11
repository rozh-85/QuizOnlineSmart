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
