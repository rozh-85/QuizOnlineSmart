import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';
import { serialIdToEmail } from '../utils/serial';

// =====================================================
// STUDENTS API
// =====================================================

export const studentApi = {
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
    const email = serialIdToEmail(serialId);
    console.log('[Student Create] Name:', fullName, '| Email:', email, '| PIN:', pin);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pin,
      options: {
        data: {
          full_name: fullName,
          role: 'student',
          serial_id: serialId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
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

  async changeStudentPassword(studentId: string, newPassword: string): Promise<void> {
    // Update auth password via database function
    const { error: rpcError } = await supabase.rpc('change_user_password', {
      target_user_id: studentId,
      new_password: newPassword
    });
    if (rpcError) throw rpcError;

    // Also update pin_display in profiles so it stays in sync
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ pin_display: newPassword })
      .eq('id', studentId);
    if (profileError) throw profileError;
  },

  async deleteStudent(id: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
