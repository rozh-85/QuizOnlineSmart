import { supabase } from '../lib/supabase';
import type { WhatsNewItem } from '../types/database';

// =====================================================
// WHAT'S NEW API (Student-facing methods)
// =====================================================

export const whatsNewApi = {
  async getPublished(): Promise<WhatsNewItem[]> {
    const { data, error } = await supabase
      .from('whats_new_items')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPublishedCountSince(since: string | null): Promise<number> {
    let query = supabase
      .from('whats_new_items')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');

    if (since) {
      query = query.gt('published_at', since);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  },
};
