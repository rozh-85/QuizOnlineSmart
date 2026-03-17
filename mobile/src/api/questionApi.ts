import { supabase } from '../lib/supabase';
import type { Question } from '../types/database';

// =====================================================
// QUESTIONS API
// =====================================================

export const questionApi = {
  async getAll(): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByLecture(lectureId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
