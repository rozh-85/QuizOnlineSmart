import { supabase } from '../lib/supabase';
import type { LectureMaterial } from '../types/database';

// =====================================================
// MATERIALS API
// =====================================================

export const materialApi = {
  async getAll(): Promise<LectureMaterial[]> {
    const { data, error } = await supabase
      .from('lecture_materials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByLecture(lectureId: string): Promise<LectureMaterial[]> {
    const { data, error } = await supabase
      .from('lecture_materials')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
