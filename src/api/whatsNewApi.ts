import { supabase } from '../lib/supabase';
import type { WhatsNewItem } from '../types/database';
import { authApi } from './authApi';

// =====================================================
// WHAT'S NEW API
// =====================================================

export const whatsNewApi = {
  /** Get all pending items (teacher view) */
  async getPending(): Promise<WhatsNewItem[]> {
    const { data, error } = await supabase
      .from('whats_new_items')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /** Get all published items (student view) */
  async getPublished(): Promise<WhatsNewItem[]> {
    const { data, error } = await supabase
      .from('whats_new_items')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /** Get history (published + declined) for teacher */
  async getHistory(): Promise<WhatsNewItem[]> {
    const { data, error } = await supabase
      .from('whats_new_items')
      .select('*')
      .in('status', ['published', 'declined'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  /** Create a pending what's-new item (called automatically on lecture/material/question creation) */
  async createPending(item: {
    item_type: 'lecture' | 'material' | 'question';
    lecture_id: string | null;
    reference_id: string;
    title: string;
    description?: string | null;
  }): Promise<WhatsNewItem> {
    const user = await authApi.getCurrentUser();

    const { data, error } = await supabase
      .from('whats_new_items')
      .insert([{
        item_type: item.item_type,
        lecture_id: item.lecture_id,
        reference_id: item.reference_id,
        title: item.title,
        description: item.description || null,
        status: 'pending',
        teacher_id: user?.id || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Publish a group of pending items (by item_type + lecture_id) */
  async publishGroup(itemType: string, lectureId: string | null): Promise<void> {
    const now = new Date().toISOString();
    let query = supabase
      .from('whats_new_items')
      .update({ status: 'published', published_at: now })
      .eq('status', 'pending')
      .eq('item_type', itemType);

    if (lectureId) {
      query = query.eq('lecture_id', lectureId);
    } else {
      query = query.is('lecture_id', null);
    }

    const { error } = await query;
    if (error) throw error;
  },

  /** Decline a group of pending items (by item_type + lecture_id) */
  async declineGroup(itemType: string, lectureId: string | null): Promise<void> {
    let query = supabase
      .from('whats_new_items')
      .update({ status: 'declined' })
      .eq('status', 'pending')
      .eq('item_type', itemType);

    if (lectureId) {
      query = query.eq('lecture_id', lectureId);
    } else {
      query = query.is('lecture_id', null);
    }

    const { error } = await query;
    if (error) throw error;
  },

  /** Publish a single item by id */
  async publishOne(id: string): Promise<void> {
    const { error } = await supabase
      .from('whats_new_items')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  /** Decline a single item by id */
  async declineOne(id: string): Promise<void> {
    const { error } = await supabase
      .from('whats_new_items')
      .update({ status: 'declined' })
      .eq('id', id);

    if (error) throw error;
  },
};
