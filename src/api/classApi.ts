import { supabase } from '../lib/supabase';
import { authApi } from './authApi';

// =====================================================
// CLASSES API
// =====================================================

export const classApi = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        teacher:profiles!classes_teacher_id_fkey(full_name),
        students:class_students(count)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getByTeacher(teacherId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(name: string): Promise<any> {
    const user = await authApi.getCurrentUser();
    const { data, error } = await supabase
      .from('classes')
      .insert([{ name, teacher_id: user?.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, name: string): Promise<any> {
    const { data, error } = await supabase
      .from('classes')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async addStudentToClass(classId: string, studentId: string): Promise<void> {
    const { error } = await supabase
      .from('class_students')
      .insert([{ class_id: classId, student_id: studentId }]);
    if (error) throw error;
  },

  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    const { error } = await supabase
      .from('class_students')
      .delete()
      .match({ class_id: classId, student_id: studentId });
    if (error) throw error;
  },

  async getClassStudents(classId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('class_students')
      .select(`
        student:profiles!class_students_student_id_fkey(*)
      `)
      .eq('class_id', classId);
    
    if (error) throw error;
    return (data || []).map((d: any) => d.student);
  }
};
