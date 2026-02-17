-- Exam Settings Table: Persists exam header/footer preferences
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.exam_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES public.profiles(id),
  subject TEXT DEFAULT '',
  department TEXT DEFAULT '',
  college TEXT DEFAULT '',
  date TEXT DEFAULT '',
  time_allowed TEXT DEFAULT '',
  header_enabled BOOLEAN DEFAULT true,
  footer_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updated_at trigger
CREATE TRIGGER update_exam_settings_updated_at
  BEFORE UPDATE ON public.exam_settings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS
ALTER TABLE public.exam_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage exam settings
CREATE POLICY "Authenticated users can view exam_settings"
  ON public.exam_settings FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert exam_settings"
  ON public.exam_settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update exam_settings"
  ON public.exam_settings FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete exam_settings"
  ON public.exam_settings FOR DELETE USING (true);
