import { supabase, type Lecture, type Question, type Profile, type LectureQuestion, type LectureQuestionMessage } from '../lib/supabase';

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

export const subscribeToLectureQuestions = (lectureId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`lecture_questions_${lectureId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'lecture_questions',
      filter: `lecture_id=eq.${lectureId}`
    }, callback)
    .subscribe();
};

export const subscribeToQuestionMessages = (questionId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`question_messages_${questionId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'lecture_question_messages',
      filter: `question_id=eq.${questionId}`
    }, callback)
    .subscribe();
};

export const subscribeToAllQuestions = (callback: (payload: any) => void) => {
  return supabase
    .channel('all-questions-channel')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'lecture_questions'
    }, callback)
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

// =====================================================
// LECTURE Q&A
// =====================================================

export const lectureQAService = {
  async getQuestionsByLecture(lectureId: string): Promise<LectureQuestion[]> {
    const { data, error } = await supabase
      .from('lecture_questions')
      .select(`
        *,
        student:profiles!lecture_questions_student_id_fkey(full_name, role),
        messages:lecture_question_messages(*)
      `)
      .eq('lecture_id', lectureId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getMessagesByQuestion(questionId: string): Promise<LectureQuestionMessage[]> {
    const { data, error } = await supabase
      .from('lecture_question_messages')
      .select(`
        *,
        sender:profiles!lecture_question_messages_sender_id_fkey(full_name, role)
      `)
      .eq('question_id', questionId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async createQuestion(lectureId: string, text: string, isPublished = false, officialAnswer = ''): Promise<LectureQuestion> {
    const user = await authService.getCurrentUser();
    
    const { data, error } = await supabase
      .from('lecture_questions')
      .insert([{
        lecture_id: lectureId,
        student_id: user?.id || null, // Allow null if not logged in
        question_text: text,
        is_published: isPublished,
        official_answer: officialAnswer,
        is_read: false
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async sendMessage(questionId: string, text: string, isMentor = false): Promise<LectureQuestionMessage> {
    const user = await authService.getCurrentUser();

    const { data, error } = await supabase
      .from('lecture_question_messages')
      .insert([{
        question_id: questionId,
        sender_id: user?.id || null, // Allow null if not logged in
        message_text: text
      }])
      .select()
      .single();
    
    if (error) throw error;

    // Reset is_read to false if a student sends a message, so the admin gets notified
    if (!isMentor) {
      await supabase
        .from('lecture_questions')
        .update({ is_read: false, updated_at: new Date().toISOString() })
        .eq('id', questionId);
    } else {
       // Just update the timestamp for sorting
       await supabase
        .from('lecture_questions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', questionId);
    }

    return data;
  },

  async togglePublishQuestion(questionId: string, isPublished: boolean): Promise<void> {
    const { error } = await supabase
      .from('lecture_questions')
      .update({ is_published: isPublished })
      .eq('id', questionId);
    
    if (error) throw error;
  },

  async updateOfficialAnswer(questionId: string, answer: string): Promise<void> {
    const { error } = await supabase
      .from('lecture_questions')
      .update({ official_answer: answer })
      .eq('id', questionId);
    
    if (error) throw error;
  },

  async deleteQuestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('lecture_questions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async markAsRead(questionId: string): Promise<void> {
    const { error } = await supabase
      .from('lecture_questions')
      .update({ is_read: true })
      .eq('id', questionId);
    
    if (error) throw error;
  },

  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('lecture_questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    
    if (error) throw error;
    return count || 0;
  },

  async getUnreadLectureIds(): Promise<string[]> {
    const { data, error } = await supabase
      .from('lecture_questions')
      .select('lecture_id')
      .eq('is_read', false);
    
    if (error) throw error;
    // Return unique IDs
    return Array.from(new Set((data || []).map(q => q.lecture_id)));
  },

  async getUnreadCountsByLecture(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('lecture_questions')
      .select('lecture_id')
      .eq('is_read', false);
    
    if (error) throw error;
    
    const counts: Record<string, number> = {};
    (data || []).forEach(q => {
      if (q.lecture_id) {
        counts[q.lecture_id] = (counts[q.lecture_id] || 0) + 1;
      }
    });
    return counts;
  }
};
