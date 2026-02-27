import { supabase } from '../lib/supabase';

// =====================================================
// REPORTS API
// =====================================================

export const reportApi = {
  async getReportSessions(filters: {
    studentId?: string;
    classId?: string;
    lectureId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any[]> {
    let query = supabase
      .from('attendance_sessions')
      .select(`
        *,
        class:classes(id, name),
        lecture:lectures(id, title),
        records:attendance_records(
          id, student_id, time_joined, time_left, hours_attended, status,
          student:profiles!attendance_records_student_id_fkey(id, full_name, serial_id, email)
        )
      `)
      .eq('status', 'completed')
      .order('session_date', { ascending: false })
      .order('started_at', { ascending: false });

    if (filters.classId) query = query.eq('class_id', filters.classId);
    if (filters.lectureId) query = query.eq('lecture_id', filters.lectureId);
    if (filters.dateFrom) query = query.gte('session_date', filters.dateFrom);
    if (filters.dateTo) query = query.lte('session_date', filters.dateTo);

    const { data, error } = await query;
    if (error) throw error;

    let sessions = data || [];

    if (filters.studentId) {
      const { data: classData } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', filters.studentId);

      const studentClassIds = new Set((classData || []).map((c: any) => c.class_id));
      sessions = sessions.filter((s: any) => studentClassIds.has(s.class_id));
    }

    return sessions;
  },

  async getEnrolledCounts(classIds: string[]): Promise<Record<string, number>> {
    if (classIds.length === 0) return {};
    const { data, error } = await supabase
      .from('class_students')
      .select('class_id')
      .in('class_id', classIds);
    if (error) throw error;

    const counts: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      counts[row.class_id] = (counts[row.class_id] || 0) + 1;
    });
    return counts;
  }
};
