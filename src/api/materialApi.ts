import { supabase } from '../lib/supabase';
import { authApi } from './authApi';
import { generateFileName } from '../utils/id';

// =====================================================
// MATERIALS API
// =====================================================

export const materialApi = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('lecture_materials')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getByLecture(lectureId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('lecture_materials')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(material: any): Promise<any> {
    try {
      const user = await authApi.getCurrentUser();
      const { data, error } = await supabase
        .from('lecture_materials')
        .insert([{
          ...material,
          teacher_id: user?.id || null
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Save material error:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Material service create failed:', err);
      throw err;
    }
  },

  async update(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('lecture_materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('lecture_materials')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async uploadFile(file: File) {
    const fileName = generateFileName(file.name);
    const filePath = fileName; // Upload to bucket root

    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('materials')
      .getPublicUrl(filePath);

    return { publicUrl, fileName: file.name };
  }
};
