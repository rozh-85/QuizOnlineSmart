import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'teacher' | 'student' | 'admin';
  created_at: string;
  updated_at: string;
};

export type Lecture = {
  id: string;
  title: string;
  description: string | null;
  sections: string[];
  teacher_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type Question = {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'blank';
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correct_index: number | null;
  correct_answer: string | null;
  explanation: string | null;
  lecture_id: string | null;
  section_id: string | null;
  teacher_id: string | null;
  created_at: string;
  updated_at: string;
};

export type QuizSession = {
  id: string;
  student_id: string;
  lecture_id: string;
  score: number;
  total_questions: number;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
  created_at: string;
};

export type QuizAnswer = {
  id: string;
  session_id: string;
  question_id: string;
  student_answer: string | null;
  is_correct: boolean;
  answered_at: string;
};

export type LectureMaterial = {
  id: string;
  title: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: 'note' | 'pdf' | 'word';
  lecture_id: string | null;
  section_id: string | null;
  teacher_id: string | null;
  created_at: string;
  updated_at: string;
};
