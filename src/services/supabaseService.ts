import { supabase, type Lecture, type Question, type Profile } from '../lib/supabase';

// =====================================================
// AUTHENTICATION
// =====================================================

export const authService = {
  async signUp(email: string, password: string, fullName: string, role: 'teacher' | 'student' = 'student') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }
};

// =====================================================
// LECTURES
// =====================================================

export const lectureService = {
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
    const user = await authService.getCurrentUser();
    
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

// =====================================================
// QUESTIONS
// =====================================================

export const questionService = {
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
    const user = await authService.getCurrentUser();
    
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

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

export const subscribeToLectures = (callback: (payload: any) => void) => {
  return supabase
    .channel('lectures_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lectures' }, callback)
    .subscribe();
};

export const subscribeToQuestions = (callback: (payload: any) => void) => {
  return supabase
    .channel('questions_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, callback)
    .subscribe();
};

export const subscribeToMaterials = (callback: (payload: any) => void) => {
  return supabase
    .channel('materials_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lecture_materials' }, callback)
    .subscribe();
};

// =====================================================
// MATERIALS
// =====================================================

export const materialService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('lecture_materials')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(material: any): Promise<any> {
    try {
      const user = await authService.getCurrentUser();
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
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
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
