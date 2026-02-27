import { supabase } from '../lib/supabase';

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

export const subscribeToAttendanceRecords = (sessionId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`attendance_records_${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'attendance_records',
      filter: `session_id=eq.${sessionId}`
    }, callback)
    .subscribe();
};

export const subscribeToAllMessages = (channelName: string, callback: (payload: any) => void) => {
  return supabase
    .channel(channelName)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'lecture_question_messages'
    }, callback)
    .subscribe();
};

export const subscribeToStudentQuestions = (studentId: string, channelName: string, callback: (payload: any) => void) => {
  return supabase
    .channel(channelName)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'lecture_questions',
      filter: `student_id=eq.${studentId}`
    }, callback)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'lecture_question_messages'
    }, callback)
    .subscribe();
};
