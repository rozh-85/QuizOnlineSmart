import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';
import { serialIdToEmail } from '../utils/serial';

// =====================================================
// AUTHENTICATION API
// =====================================================

export const authApi = {
  async signUp(email: string, password: string, fullName: string, role: 'teacher' | 'student' = 'student', serialId?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          serial_id: serialId || null,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string, fingerprint?: string) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error('Authentication failed');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    // Device Lock Logic for Students
    if (profile.role === 'student' && fingerprint) {
      if (profile.device_lock_active && profile.last_fingerprint && profile.last_fingerprint !== fingerprint) {
        await supabase.auth.signOut();
        throw new Error('This account is already active on another device.');
      }

      if (!profile.device_lock_active) {
        await supabase
          .from('profiles')
          .update({
            device_lock_active: true,
            last_fingerprint: fingerprint,
          })
          .eq('id', profile.id);
      }
    }

    return { ...authData, profile };
  },

  async signInWithSerial(serialId: string, pin: string, fingerprint: string) {
    const email = serialIdToEmail(serialId);
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
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
