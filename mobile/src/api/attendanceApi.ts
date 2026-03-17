import { supabase } from '../lib/supabase';

// =====================================================
// ATTENDANCE API (Student-facing methods)
// =====================================================

export const attendanceApi = {
  async verifyAndJoin(token: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('verify_and_join_attendance', {
      p_token: token,
      p_student_id: user.id,
    });
    if (error) throw error;
    return data;
  },

  async getStudentAttendanceHistory(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        id, status, time_joined, time_left, hours_attended,
        session:attendance_sessions(
          id, session_date, status,
          class:classes(id, name),
          lecture:lectures(id, title)
        )
      `)
      .eq('student_id', studentId)
      .order('time_joined', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
