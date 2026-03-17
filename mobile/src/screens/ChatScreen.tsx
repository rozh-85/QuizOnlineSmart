import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/app';
import { useAuth } from '../context/AuthContext';
import { lectureQAApi } from '../api/lectureQAApi';
import { subscribeToStudentQuestions } from '../services/realtimeService';
import { supabase } from '../lib/supabase';
import { formatRelativeTime } from '../utils/format';

const ChatScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [unreadThreads, setUnreadThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const fetchUnread = useCallback(async (userId: string) => {
    try {
      const threads = await lectureQAApi.getStudentUnreadThreads(userId);
      if (mountedRef.current) setUnreadThreads(threads);
    } catch (e) {
      console.error('Error fetching unread:', e);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let sub: any = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const init = async () => {
      if (!user) return;
      try {
        await fetchUnread(user.id);

        const channelName = 'mobile-student-notif-' + user.id;
        try { supabase.removeChannel(supabase.channel(channelName)); } catch { /* ignore */ }

        sub = subscribeToStudentQuestions(user.id, channelName, () => {
          if (mountedRef.current) fetchUnread(user.id);
        });

        pollInterval = setInterval(() => {
          if (mountedRef.current) fetchUnread(user.id);
        }, 5000);
      } catch (e) {
        console.error('Chat init error:', e);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      if (sub) sub.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [user, fetchUnread]);

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchUnread(user.id);
    setRefreshing(false);
  };

  const getLastMessage = (thread: any) => {
    if (!thread.messages || thread.messages.length === 0) return null;
    return thread.messages[0]; // Already sorted newest first
  };

  const isTeacherMessage = (msg: any, thread: any) => {
    if (thread.student_id && msg.sender_id && msg.sender_id !== thread.student_id) return true;
    return false;
  };

  const handleNotificationClick = async (thread: any) => {
    try {
      await lectureQAApi.markAsRead(thread.id, true);
      setUnreadThreads(prev => prev.filter(t => t.id !== thread.id));
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
    navigation.navigate('LectureDetail', {
      lectureId: thread.lecture_id,
      threadId: thread.id,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <View style={styles.headerIcon}>
              <Ionicons name="chatbubbles" size={18} color={COLORS.primary[600]} />
            </View>
            {unreadThreads.length > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {unreadThreads.length > 9 ? '9+' : unreadThreads.length}
                </Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSub}>
              {unreadThreads.length > 0
                ? `${unreadThreads.length} unread message${unreadThreads.length > 1 ? 's' : ''}`
                : 'All caught up!'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingSkeletons}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.skeleton}>
                <View style={styles.skeletonIcon} />
                <View style={styles.skeletonLines}>
                  <View style={[styles.skeletonLine, { width: '60%' }]} />
                  <View style={[styles.skeletonLine, { width: '90%' }]} />
                  <View style={[styles.skeletonLine, { width: '40%' }]} />
                </View>
              </View>
            ))}
          </View>
        ) : unreadThreads.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubbles-outline" size={32} color={COLORS.slate[300]} />
            <Text style={styles.emptyTitle}>No new messages</Text>
            <Text style={styles.emptySub}>Teacher replies will appear here</Text>
          </View>
        ) : (
          unreadThreads.map(thread => {
            const lastMsg = getLastMessage(thread);
            const fromTeacher = lastMsg ? isTeacherMessage(lastMsg, thread) : false;

            return (
              <TouchableOpacity
                key={thread.id}
                style={styles.threadCard}
                onPress={() => handleNotificationClick(thread)}
                activeOpacity={0.7}
              >
                <View style={styles.threadIcon}>
                  <Ionicons name="chatbubble" size={16} color={COLORS.primary[600]} />
                </View>
                <View style={styles.threadBody}>
                  <View style={styles.threadTop}>
                    <Text style={styles.threadTitle} numberOfLines={1}>
                      {thread.lecture?.title || 'Lecture'}
                    </Text>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={11} color={COLORS.slate[400]} />
                      <Text style={styles.timeText}>{formatRelativeTime(thread.updated_at)}</Text>
                    </View>
                  </View>
                  <Text style={styles.threadPreview} numberOfLines={2}>
                    {lastMsg
                      ? `${fromTeacher ? 'Teacher replied' : 'You'}: "${lastMsg.message_text.substring(0, 80)}${lastMsg.message_text.length > 80 ? '...' : ''}"`
                      : `Your question: "${thread.question_text.substring(0, 80)}${thread.question_text.length > 80 ? '...' : ''}"`
                    }
                  </Text>
                  <View style={styles.threadBottom}>
                    <View style={styles.unreadDot} />
                    <Text style={styles.newReplyText}>New reply</Text>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.slate[300]} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate[50] },
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[200],
    padding: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconWrap: { position: 'relative' },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.rose[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  headerBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.slate[900] },
  headerSub: { fontSize: 13, color: COLORS.slate[500], marginTop: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  loadingSkeletons: { gap: 8 },
  skeleton: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.slate[200],
  },
  skeletonLines: { flex: 1, gap: 8 },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: COLORS.slate[200] },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: COLORS.slate[500] },
  emptySub: { fontSize: 12, color: COLORS.slate[400] },
  threadCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  threadIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadBody: { flex: 1 },
  threadTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  threadTitle: { fontSize: 14, fontWeight: '700', color: COLORS.slate[900], flex: 1, marginRight: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeText: { fontSize: 11, color: COLORS.slate[400] },
  threadPreview: {
    fontSize: 12,
    color: COLORS.slate[500],
    lineHeight: 17,
    marginBottom: 8,
  },
  threadBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary[500],
  },
  newReplyText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary[600],
    flex: 1,
  },
});

export default ChatScreen;
