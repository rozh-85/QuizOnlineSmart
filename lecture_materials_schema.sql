-- ============================================
-- 1. Create the lecture_materials table
-- ============================================
CREATE TABLE IF NOT EXISTS public.lecture_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT CHECK (file_type IN ('note', 'pdf', 'word')),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  section_id TEXT,
  teacher_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. PUBLIC ACCESS FOR TESTING (Prototype Only)
-- ============================================
-- This fixes "new row violates row-level security policy"
ALTER TABLE public.lecture_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public All Materials Access" ON public.lecture_materials;
CREATE POLICY "Public All Materials Access" ON public.lecture_materials FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 3. STORAGE BUCKET & POLICIES (Critical for Uploads)
-- ============================================
-- 1. Create the 'materials' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies (Allow Public Uploads for Testing)
-- This fixes "Bucket not found" if bucket exists but policy is missing
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials');

DROP POLICY IF EXISTS "Public Select" ON storage.objects;
CREATE POLICY "Public Select" ON storage.objects FOR SELECT USING (bucket_id = 'materials');

DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'materials');

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'materials');

-- ============================================
-- 4. REAL-TIME REPLICATION
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.lecture_materials;
