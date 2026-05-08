import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

export type ManagedRole = 'root' | 'admin' | 'teacher' | 'student';

export interface ManagedUserInput {
  email: string;
  password: string;
  fullName: string;
  role: ManagedRole;
  serialId?: string;
  pin?: string;
}

export interface ManagedUserUpdate {
  email: string;
  fullName: string;
  role: ManagedRole;
  serialId?: string;
}

export const userApi = {
  async getAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(input: ManagedUserInput): Promise<Profile> {
    const { data, error } = await supabase.rpc('create_managed_account', {
      user_email: input.email,
      user_password: input.password,
      user_full_name: input.fullName,
      user_role: input.role,
      user_serial_id: input.role === 'student' ? input.serialId || null : null,
      user_pin: input.role === 'student' ? input.pin || input.password : null,
    });

    if (error) throw error;
    return data;
  },

  async update(id: string, input: ManagedUserUpdate): Promise<Profile> {
    const { data, error } = await supabase.rpc('update_managed_account', {
      target_user_id: id,
      user_email: input.email,
      user_full_name: input.fullName,
      user_role: input.role,
      user_serial_id: input.role === 'student' ? input.serialId || null : null,
    });

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.rpc('delete_managed_account', {
      target_user_id: id,
    });

    if (error) throw error;
  },
};
