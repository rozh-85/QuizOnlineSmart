import { supabase } from '../lib/supabase';
import type { LectureQuestion, LectureQuestionMessage } from '../types/database';
import { authApi } from './authApi';
import { getTeacherReadMap, isStillUnread } from '../utils/localStorage';

// =====================================================
// LECTURE Q&A API
// =====================================================

export const lectureQAApi = {
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
    const user = await authApi.getCurrentUser();
    
    const { data, error } = await supabase
      .from('lecture_questions')
      .insert([{
        lecture_id: lectureId,
        student_id: user?.id || null,
        question_text: text,
        is_published: isPublished,
        official_answer: officialAnswer,
        is_read: false,
        is_read_by_student: true
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

  async sendMessage(question_id: string, text: string, is_mentor = false, image_urls?: string[]): Promise<LectureQuestionMessage> {
    const user = await authApi.getCurrentUser();
    const sender_id = user?.id || null;

    const insertData: any = {
      question_id,
      sender_id,
      message_text: text,
      is_from_teacher: is_mentor
    };
    
    if (image_urls && image_urls.length > 0) {
      insertData.image_url = image_urls.length === 1 ? image_urls[0] : JSON.stringify(image_urls);
    }

    const { data, error } = await supabase
      .from('lecture_question_messages')
      .insert([insertData])
      .select()
      .single();
    
    if (error) throw error;

    // --- Role & Notification Logic ---
    if (!is_mentor) {
      // Student message: mark thread as unread for teacher, read for student
      await supabase
        .from('lecture_questions')
        .update({ 
          is_read: false, 
          is_read_by_student: true,
          updated_at: new Date().toISOString() 
        })
        .eq('id', question_id);
    } else {
      // Teacher message: mark thread as read for teacher, unread for student
      await supabase
        .from('lecture_questions')
        .update({ 
          is_read: true,
          is_read_by_student: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', question_id);
    }

    return data;
  },

  async editMessage(messageId: string, newText: string): Promise<void> {
    const { data, error } = await supabase
      .from('lecture_question_messages')
      .update({ message_text: newText })
      .eq('id', messageId)
      .select();
    
    if (error) throw error;
    if (!data || data.length === 0) {
      console.warn('[editMessage] Update returned 0 rows – RLS may be blocking. Run fix_message_edit_rls.sql in Supabase SQL Editor.');
    }
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
      ? { is_read_by_student: true, updated_at: new Date().toISOString() } 
      : { is_read: true, updated_at: new Date().toISOString() };
    
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
        console.error('[markAsRead] Update returned but read flag is still false:', questionId, updated);
        throw new Error('markAsRead verification failed: flag still false');
      } else {
        console.log('[markAsRead] Successfully marked as read:', questionId, forStudent ? 'student' : 'teacher');
      }
    } else {
      console.error('[markAsRead] Update returned no rows - thread may not exist:', questionId);
      throw new Error('markAsRead failed: no rows returned');
    }
  },

  async getUnreadCount(): Promise<number> {
    const { data, error } = await supabase
      .from('lecture_questions')
      .select('id, updated_at')
      .eq('is_read', false);
    
    if (error) throw error;
    
    const readMap = getTeacherReadMap();
    const unread = (data || []).filter(q => isStillUnread(q.id, q.updated_at, readMap));
    return unread.length;
  },

  async getUnreadLectureIds(): Promise<string[]> {
    const { data, error } = await supabase
      .from('lecture_questions')
      .select('id, lecture_id, updated_at')
      .eq('is_read', false);
    
    if (error) throw error;
    
    const readMap = getTeacherReadMap();
    const unread = (data || []).filter(q => isStillUnread(q.id, q.updated_at, readMap));
    return Array.from(new Set(unread.map(q => q.lecture_id)));
  },

  async getUnreadCountsByLecture(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('lecture_questions')
      .select('id, lecture_id, updated_at')
      .eq('is_read', false);
    
    if (error) throw error;
    
    const readMap = getTeacherReadMap();
    const counts: Record<string, number> = {};
    (data || []).forEach((q: any) => {
      if (q.lecture_id && isStillUnread(q.id, q.updated_at, readMap)) {
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
    // Single query: fetch threads with lecture title AND latest messages in one go
    const { data, error } = await supabase
      .from('lecture_questions')
      .select(`
        *,
        lectures(id, title),
        messages:lecture_question_messages(
          message_text, created_at, sender_id
        )
      `)
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
    
    // Normalize the joined data structure
    return (data || []).map((thread: any) => ({
      ...thread,
      lecture: thread.lectures || { id: thread.lecture_id, title: 'Lecture' },
      messages: (thread.messages || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }));
  }
};
