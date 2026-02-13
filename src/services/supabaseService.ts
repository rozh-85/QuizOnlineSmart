import { supabase, type Lecture, type Question, type Profile, type LectureQuestion, type LectureQuestionMessage } from '../lib/supabase';

// =====================================================
// AUTHENTICATION
// =====================================================

export const authService = {
  async signUp(email: string, password: string, fullName: string, role: 'teacher' | 'student' = 'student', serialId?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          serial_id: serialId || null
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string, fingerprint?: string) {
    console.log('[Auth] Attempting sign in with email:', email);
    // 1. Regular Sign In
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (authError) {
      console.error('[Auth] Sign in failed for:', email, '| Error:', authError.message);
      throw authError;
    }
    console.log('[Auth] Sign in successful for:', email);

    if (!authData.user) throw new Error('Authentication failed');

    // 2. Fetch Profile for Role and Device Lock Check
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    // 3. Device Lock Logic for Students
    if (profile.role === 'student' && fingerprint) {
      if (profile.device_lock_active && profile.last_fingerprint && profile.last_fingerprint !== fingerprint) {
        // Sign out if blocked
        await supabase.auth.signOut();
        throw new Error('This account is already active on another device.');
      }

      // Lock device if not already locked
      if (!profile.device_lock_active) {
        await supabase
          .from('profiles')
          .update({ 
            device_lock_active: true, 
            last_fingerprint: fingerprint 
          })
          .eq('id', profile.id);
      }
    }

    return { ...authData, profile };
  },

  async signInWithSerial(serialId: string, pin: string, fingerprint: string) {
    const cleanId = serialId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const email = `${cleanId}@kimya.com`;
    console.log('[Auth] Student login - SerialID:', serialId, '-> Clean:', cleanId, '-> Email:', email, '| PIN length:', pin.length);
    return this.signIn(email, pin, fingerprint);
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
// CLASSES
// =====================================================

export const classService = {
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
    const user = await authService.getCurrentUser();
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

// =====================================================
// STUDENTS
// =====================================================

export const studentService = {
  async getAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async updateStudent(id: string, updates: { full_name?: string; pin_display?: string }): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async updateStudentPin(id: string, newPin: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ pin_display: newPin })
      .eq('id', id);
    if (error) throw error;
  },

  async createStudent(fullName: string, serialId: string, pin: string) {
    const cleanId = serialId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const email = `${cleanId}@kimya.com`;
    console.log('[Student Create] Name:', fullName, '| Email:', email, '| PIN:', pin);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pin,
      options: {
        data: {
          full_name: fullName,
          role: 'student',
          serial_id: cleanId,
          pin: pin
        }
      }
    });

    if (error) {
      console.error('[Student Create] Failed:', error.message);
      throw error;
    }
    
    // Check if user was actually created or if email confirmation is pending
    if (data.user && !data.session) {
      console.warn('[Student Create] User created but NO SESSION - email confirmation may be required!');
      console.warn('[Student Create] Go to Supabase Dashboard > Authentication > Providers > Email and DISABLE "Confirm email"');
    }
    
    console.log('[Student Create] Success:', email, '| User ID:', data.user?.id);
    return data;
  },

  async resetDeviceLock(studentId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        device_lock_active: false, 
        last_fingerprint: null 
      })
      .eq('id', studentId);
    
    if (error) throw error;
  },

  async deleteStudent(id: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    if (error) throw error;
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
        is_read: false, // Teacher unread
        is_read_by_student: true // Student is creator
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async uploadChatImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `chat/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[uploadChatImage] Storage upload failed:', uploadError);
        throw new Error(`Image upload failed: ${uploadError.message || 'Unknown storage error'}`);
      }

      if (!uploadData) {
        throw new Error('Image upload returned no data');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('materials')
        .getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('[uploadChatImage] Successfully uploaded image:', fileName);
      return publicUrl;
    } catch (error: any) {
      console.error('[uploadChatImage] Error uploading chat image:', error);
      throw error;
    }
  },

  async sendMessage(questionId: string, text: string, isMentor = false, imageUrls?: string[]): Promise<LectureQuestionMessage> {
    const user = await authService.getCurrentUser();

    const insertData: any = {
      question_id: questionId,
      sender_id: user?.id || null,
      message_text: text
    };
    if (imageUrls && imageUrls.length > 0) {
      // Store as JSON array string for multiple images, or single URL for one image
      insertData.image_url = imageUrls.length === 1 ? imageUrls[0] : JSON.stringify(imageUrls);
    }

    const { data, error } = await supabase
      .from('lecture_question_messages')
      .insert([insertData])
      .select()
      .single();
    
    if (error) throw error;

    // Reset is_read to false if a student sends a message, so the admin gets notified
    if (!isMentor) {
      const { error: updateError } = await supabase
        .from('lecture_questions')
        .update({ 
          is_read: false, 
          is_read_by_student: true,
          updated_at: new Date().toISOString() 
        })
        .eq('id', questionId);
      
      if (updateError) {
        console.error('[sendMessage] Failed to update is_read for student message:', updateError);
        throw updateError;
      }
    } else {
       // Flag for student if mentor sends a message - CRITICAL: ensure is_read is set to true
       // Try updating without updated_at first, then with it if that fails
       let updateData: any = { 
         is_read: true,
         is_read_by_student: false
       };
       
       const { error: updateError } = await supabase
        .from('lecture_questions')
        .update(updateData)
        .eq('id', questionId);
      
      if (updateError) {
        console.error('[sendMessage] Failed to mark thread as read when teacher sent message:', updateError);
        // Try again without updated_at in case that field doesn't exist or has issues
        const { error: retryError } = await supabase
          .from('lecture_questions')
          .update({ 
            is_read: true,
            is_read_by_student: false
          })
          .eq('id', questionId);
        
        if (retryError) {
          console.error('[sendMessage] Retry also failed:', retryError);
          // Don't throw here - message was sent successfully, but read status update failed
          // We'll retry with markAsRead below
        } else {
          console.log('[sendMessage] Successfully marked thread as read (retry without updated_at):', questionId);
        }
      } else {
        console.log('[sendMessage] Successfully marked thread as read when teacher sent message:', questionId);
      }
    }

    return data;
  },

  async editMessage(messageId: string, newText: string): Promise<void> {
    const { error } = await supabase
      .from('lecture_question_messages')
      .update({ message_text: newText })
      .eq('id', messageId);
    
    if (error) throw error;
  },

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('lecture_question_messages')
      .delete()
      .eq('id', messageId);
    
    if (error) throw error;
  },

  async editQuestion(questionId: string, newText: string): Promise<void> {
    const { error } = await supabase
      .from('lecture_questions')
      .update({ question_text: newText })
      .eq('id', questionId);
    
    if (error) throw error;
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

  async markAsRead(questionId: string, forStudent = false): Promise<void> {
    const updateData = forStudent 
      ? { is_read_by_student: true } 
      : { is_read: true };
    
    const { data, error } = await supabase
      .from('lecture_questions')
      .update(updateData)
      .eq('id', questionId)
      .select('id, is_read, is_read_by_student');
    
    if (error) {
      console.error('[markAsRead] Database update failed:', error);
      throw error;
    }
    
    // Verify the update actually succeeded
    if (data && data.length > 0) {
      const updated = data[0];
      const expectedRead = forStudent ? updated.is_read_by_student : updated.is_read;
      if (!expectedRead) {
        console.warn('[markAsRead] Update returned but read flag is still false:', questionId, updated);
      } else {
        console.log('[markAsRead] Successfully marked as read:', questionId, forStudent ? 'student' : 'teacher');
      }
    } else {
      console.warn('[markAsRead] Update returned no rows - thread may not exist:', questionId);
    }
  },

  async getUnreadCount(): Promise<number> {
    const { data, count, error } = await supabase
      .from('lecture_questions')
      .select('*', { count: 'exact' })
      .eq('is_read', false);
    
    console.log('[DEBUG] Admin Unread Count Fetch:', { count, firstFewIds: (data || []).slice(0, 3).map(d => d.id), error });
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
    (data || []).forEach((q: any) => {
      if (q.lecture_id) {
        counts[q.lecture_id] = (counts[q.lecture_id] || 0) + 1;
      }
    });
    return counts;
  },

  async getStudentUnreadCount(studentId: string): Promise<number> {
    const { count, error } = await supabase
      .from('lecture_questions')
      .select('*', { count: 'exact' })
      .eq('student_id', studentId)
      .eq('is_read_by_student', false);
    
    if (error) throw error;
    return count || 0;
  },

  async getStudentUnreadThreads(studentId: string): Promise<any[]> {
    // Simple query: just get the threads with lecture title
    const { data, error } = await supabase
      .from('lecture_questions')
      .select('*, lectures(id, title)')
      .eq('student_id', studentId)
      .eq('is_read_by_student', false)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('[Notif] Error fetching unread threads:', error);
      // Fallback: query without join
      const { data: fallback } = await supabase
        .from('lecture_questions')
        .select('*')
        .eq('student_id', studentId)
        .eq('is_read_by_student', false)
        .order('updated_at', { ascending: false });
      return fallback || [];
    }
    
    // For each thread, fetch the latest messages with proper sender role
    const threadsWithMessages = await Promise.all(
      (data || []).map(async (thread: any) => {
        const { data: msgs } = await supabase
          .from('lecture_question_messages')
          .select('message_text, created_at, sender_id, sender:profiles!lecture_question_messages_sender_id_fkey(role)')
          .eq('question_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(3);
        
        return {
          ...thread,
          lecture: thread.lectures || { id: thread.lecture_id, title: 'Lecture' },
          messages: (msgs || []).map((m: any) => ({
            ...m,
            // Normalize: put role in both paths so getLastTeacherMessage can find it
            sender: m.sender || null,
            profiles: m.sender || null
          }))
        };
      })
    );
    
    return threadsWithMessages;
  }
};
