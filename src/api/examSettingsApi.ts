import { supabase } from '../lib/supabase';

export interface ExamSettingsRow {
  id: string;
  subject: string;
  department: string;
  college: string;
  date: string;
  time_allowed: string;
  header_enabled: boolean;
  footer_enabled: boolean;
}

type ExamSettingsPayload = Omit<ExamSettingsRow, 'id'>;

export const examSettingsApi = {
  async getLatest(): Promise<ExamSettingsRow | null> {
    const { data, error } = await supabase
      .from('exam_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async upsert(settings: Partial<ExamSettingsRow> & { id?: string }): Promise<ExamSettingsRow | null> {
    const payload: ExamSettingsPayload = {
      subject: settings.subject || '',
      department: settings.department || '',
      college: settings.college || '',
      date: settings.date || '',
      time_allowed: settings.time_allowed || '',
      header_enabled: settings.header_enabled ?? true,
      footer_enabled: settings.footer_enabled ?? true,
    };

    if (settings.id) {
      const { error } = await supabase
        .from('exam_settings')
        .update(payload)
        .eq('id', settings.id);
      if (error) throw error;
      return { ...payload, id: settings.id };
    } else {
      const { data, error } = await supabase
        .from('exam_settings')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },
};
