import { supabase } from '../lib/supabase';
import type { Question } from '../types/database';
import { authApi } from './authApi';

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

  async getById(id: string): Promise<Question | null> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByLecture(lectureId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(question: Omit<Question, 'id' | 'created_at' | 'updated_at' | 'teacher_id'>): Promise<Question> {
    const user = await authApi.getCurrentUser();
    
    const { data, error } = await supabase
      .from('questions')
      .insert([{
        ...question,
        teacher_id: user?.id || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Omit<Question, 'id' | 'created_at' | 'updated_at' | 'teacher_id'>>): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
