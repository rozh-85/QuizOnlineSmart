import { supabase } from '../lib/supabase';
import type { Lecture } from '../types/database';
import { authApi } from './authApi';

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

  async create(lecture: Omit<Lecture, 'id' | 'created_at' | 'updated_at' | 'teacher_id'>): Promise<Lecture> {
    const user = await authApi.getCurrentUser();
    
    const { data, error } = await supabase
      .from('lectures')
      .insert([{
        ...lecture,
        teacher_id: user?.id || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Omit<Lecture, 'id' | 'created_at' | 'updated_at' | 'teacher_id'>>): Promise<Lecture> {
    const { data, error } = await supabase
      .from('lectures')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('lectures')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
