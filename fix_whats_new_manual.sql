-- =====================================================
-- Allow 'manual' item_type in whats_new_items
-- =====================================================

-- 1. Drop the existing CHECK constraint on item_type
ALTER TABLE whats_new_items
  DROP CONSTRAINT IF EXISTS whats_new_items_item_type_check;

-- 2. Re-add with 'manual' included
ALTER TABLE whats_new_items
  ADD CONSTRAINT whats_new_items_item_type_check
  CHECK (item_type IN ('lecture', 'material', 'question', 'manual'));
