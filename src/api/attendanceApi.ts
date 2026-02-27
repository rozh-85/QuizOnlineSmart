import { supabase } from '../lib/supabase';
import { generateToken } from '../utils/id';
import { formatHoursAttended } from '../utils/format';
import { QR_TOKEN_EXPIRY_MS } from '../constants/app';

// =====================================================
// ATTENDANCE API
// =====================================================

export const attendanceApi = {
  async createSession(classId: string, teacherId: string, sessionDate: string, lectureId?: string): Promise<any> {
    const insertData: any = {
      class_id: classId,
      teacher_id: teacherId,
      session_date: sessionDate,
      status: 'pending'
    };
    if (lectureId) insertData.lecture_id = lectureId;

    const { data, error } = await supabase
      .from('attendance_sessions')
      .insert([insertData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async startSession(sessionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('attendance_sessions')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async stopSession(sessionId: string): Promise<any> {
    const endTime = new Date().toISOString();

    // 1. End the session
    const { data: session, error: sessErr } = await supabase
      .from('attendance_sessions')
      .update({ status: 'completed', ended_at: endTime })
      .eq('id', sessionId)
      .select()
      .single();
    if (sessErr) throw sessErr;

    // 2. Fill end time for all present students and calculate hours
    const { data: records, error: recErr } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'present')
      .is('time_left', null);
    if (recErr) throw recErr;

    if (records && records.length > 0) {
      for (const record of records) {
        const hoursAttended = formatHoursAttended(record.time_joined, endTime);

        await supabase
          .from('attendance_records')
          .update({
            time_left: endTime,
            hours_attended: hoursAttended
          })
          .eq('id', record.id);
      }
    }

    // 3. Deactivate all tokens for this session
    await supabase
      .from('attendance_tokens')
      .update({ is_active: false })
      .eq('session_id', sessionId);

    return session;
  },

  async createToken(sessionId: string): Promise<any> {
    const token = generateToken(sessionId);
    const expiresAt = new Date(Date.now() + QR_TOKEN_EXPIRY_MS).toISOString();

    const { data, error } = await supabase
      .from('attendance_tokens')
      .insert([{
        session_id: sessionId,
        token,
        is_active: true,
        expires_at: expiresAt
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deactivateSessionTokens(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('attendance_tokens')
      .update({ is_active: false })
      .eq('session_id', sessionId);
    if (error) throw error;
  },

  async getSessionRecords(sessionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        student:profiles!attendance_records_student_id_fkey(id, full_name, serial_id, email)
      `)
      .eq('session_id', sessionId)
      .order('time_joined', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async kickStudent(recordId: string): Promise<void> {
    // Get the record to calculate hours
    const { data: record, error: fetchErr } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('id', recordId)
      .single();
    if (fetchErr) throw fetchErr;

    const endTime = new Date().toISOString();
    const hoursAttended = formatHoursAttended(record.time_joined, endTime);

    const { error } = await supabase
      .from('attendance_records')
      .update({
        status: 'removed',
        time_left: endTime,
        hours_attended: hoursAttended
      })
      .eq('id', recordId);
    if (error) throw error;
  },

  async verifyAndJoin(token: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('verify_and_join_attendance', {
      p_token: token,
      p_student_id: user.id
    });
    if (error) throw error;
    return data;
  },

  async getSession(sessionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select(`
        *,
        class:classes(id, name)
      `)
      .eq('id', sessionId)
      .single();
    if (error) throw error;
    return data;
  },

  async getActiveSessionForTeacher(teacherId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select(`
        *,
        class:classes(id, name)
      `)
      .eq('teacher_id', teacherId)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
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
  }
};
