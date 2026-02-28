-- =====================================================
-- What's New Publisher Schema
-- =====================================================

-- Table to track pending/published/declined "what's new" items
create table if not exists whats_new_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('lecture', 'material', 'question')),
  lecture_id uuid references lectures(id) on delete cascade,
  reference_id uuid not null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'published', 'declined')),
  teacher_id uuid references auth.users(id),
  created_at timestamptz default now(),
  published_at timestamptz
);

-- Index for fast lookups by status
create index if not exists idx_whats_new_status on whats_new_items(status);
create index if not exists idx_whats_new_lecture on whats_new_items(lecture_id, item_type, status);

-- RLS policies
alter table whats_new_items enable row level security;

-- Teachers can insert their own items
create policy "Teachers can insert whats_new_items"
  on whats_new_items for insert
  with check (auth.uid() = teacher_id);

-- Teachers can view all items they created
create policy "Teachers can select whats_new_items"
  on whats_new_items for select
  using (auth.uid() = teacher_id or status = 'published');

-- Teachers can update their own items
create policy "Teachers can update whats_new_items"
  on whats_new_items for update
  using (auth.uid() = teacher_id);

-- Teachers can delete their own items
create policy "Teachers can delete whats_new_items"
  on whats_new_items for delete
  using (auth.uid() = teacher_id);
