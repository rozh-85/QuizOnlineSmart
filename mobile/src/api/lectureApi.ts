import { supabase } from '../lib/supabase';
import type { Lecture } from '../types/database';

// =====================================================
// LECTURES API
// =====================================================

export const lectureApi = {
  async getAll(): Promise<Lecture[]> {
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Lecture | null> {
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
};
