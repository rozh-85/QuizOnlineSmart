import { supabase } from '../lib/supabase';
import type { LectureQuestion, LectureQuestionMessage } from '../types/database';
import { authApi } from './authApi';

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

  async createQuestion(lectureId: string, text: string): Promise<LectureQuestion> {
    const user = await authApi.getCurrentUser();

    const { data, error } = await supabase
      .from('lecture_questions')
      .insert([{
        lecture_id: lectureId,
        student_id: user?.id || null,
        question_text: text,
        is_published: false,
        official_answer: '',
        is_read: false,
        is_read_by_student: true,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async sendMessage(questionId: string, text: string, isTeacher = false): Promise<LectureQuestionMessage> {
    const user = await authApi.getCurrentUser();

    const { data, error } = await supabase
      .from('lecture_question_messages')
      .insert([{
        question_id: questionId,
        sender_id: user?.id || null,
        message_text: text,
        is_from_teacher: isTeacher,
      }])
      .select()
      .single();

    if (error) throw error;

    // Update read status
    if (!isTeacher) {
      await supabase
        .from('lecture_questions')
        .update({
          is_read: false,
          is_read_by_student: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', questionId);
    }

    return data;
  },

  async markAsRead(questionId: string, forStudent = false): Promise<void> {
    const updateData = forStudent
      ? { is_read_by_student: true, updated_at: new Date().toISOString() }
      : { is_read: true, updated_at: new Date().toISOString() };

    const { error } = await supabase
      .from('lecture_questions')
      .update(updateData)
      .eq('id', questionId);

    if (error) throw error;
  },

  async getStudentUnreadCount(studentId: string): Promise<number> {
    const { count, error } = await supabase
      .from('lecture_questions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('is_read_by_student', false);

    if (error) throw error;
    return count || 0;
  },

  async getStudentUnreadThreads(studentId: string): Promise<any[]> {
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
      const { data: fallback } = await supabase
        .from('lecture_questions')
        .select('*')
        .eq('student_id', studentId)
        .eq('is_read_by_student', false)
        .order('updated_at', { ascending: false });
      return fallback || [];
    }

    return (data || []).map((thread: any) => ({
      ...thread,
      lecture: thread.lectures || { id: thread.lecture_id, title: 'Lecture' },
      messages: (thread.messages || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    }));
  },
};
