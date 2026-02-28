import { useState, useEffect, useRef, useCallback } from 'react';
import { lectureQAApi } from '../api/lectureQAApi';
import { whatsNewApi } from '../api/whatsNewApi';
import { subscribeToAllQuestions, subscribeToAllMessages, subscribeToWhatsNew } from '../services/realtimeService';

// =====================================================
// Shared teacher unread-count hook
// Replaces duplicated logic in AdminLayout, QAManager
// =====================================================

interface UseTeacherUnreadCountOptions {
  channelPrefix: string;
}

export const useTeacherUnreadCount = ({ channelPrefix }: UseTeacherUnreadCountOptions) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const lastManualUpdate = useRef(0);
  const processedIds = useRef(new Set<string>());
  const pendingTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const fetchUnread = useCallback(async () => {
    try {
      const count = await lectureQAApi.getUnreadCount();
      setUnreadCount(count);
    } catch (e) {
      console.error('Error fetching unread count:', e);
    }
  }, []);

  const clearPending = useCallback(() => {
    pendingTimeouts.current.forEach(clearTimeout);
    pendingTimeouts.current = [];
  }, []);

  const scheduleFetch = useCallback((delay: number) => {
    if (Date.now() - lastManualUpdate.current < 4000) return;
    clearPending();
    pendingTimeouts.current.push(setTimeout(fetchUnread, delay));
    pendingTimeouts.current.push(setTimeout(fetchUnread, delay + 2000));
  }, [fetchUnread, clearPending]);

  useEffect(() => {
    fetchUnread();

    const questionsSub = subscribeToAllQuestions(() => scheduleFetch(300));
    const messagesSub = subscribeToAllMessages(`${channelPrefix}-messages`, () => scheduleFetch(600));
    const interval = setInterval(() => {
      if (Date.now() - lastManualUpdate.current > 5000) fetchUnread();
    }, 15000);

    const handleManualChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const threadId = detail?.id;
      const role = detail?.role;

      if (role === 'teacher' && threadId && !processedIds.current.has(threadId)) {
        processedIds.current.add(threadId);
        setUnreadCount(prev => Math.max(0, prev - 1));
        lastManualUpdate.current = Date.now();
      } else if (!threadId && role === 'teacher') {
        lastManualUpdate.current = Date.now();
        scheduleFetch(2000);
      }
      if (threadId) scheduleFetch(3000);
    };
    window.addEventListener('unread-count-changed', handleManualChange);

    return () => {
      questionsSub.unsubscribe();
      messagesSub.unsubscribe();
      clearInterval(interval);
      clearPending();
      window.removeEventListener('unread-count-changed', handleManualChange);
    };
  }, [channelPrefix, fetchUnread, scheduleFetch, clearPending]);

  return { unreadCount, setUnreadCount };
};

// =====================================================
// Shared teacher unread-counts-by-lecture hook
// Replaces duplicated logic in QAManager
// =====================================================

export const useTeacherUnreadByLecture = (channelPrefix: string, selectedLectureId: string | null) => {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const lastManualUpdate = useRef(0);
  const processedIds = useRef(new Set<string>());
  const pendingTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const refreshCounts = useCallback(async () => {
    try {
      const counts = await lectureQAApi.getUnreadCountsByLecture();
      setUnreadCounts(counts);
    } catch (e) {
      console.error('Error fetching unread counts by lecture:', e);
    }
  }, []);

  const clearPending = useCallback(() => {
    pendingTimeouts.current.forEach(clearTimeout);
    pendingTimeouts.current = [];
  }, []);

  const scheduleFetch = useCallback((delay: number) => {
    if (Date.now() - lastManualUpdate.current < 4000) return;
    clearPending();
    pendingTimeouts.current.push(setTimeout(refreshCounts, delay));
    pendingTimeouts.current.push(setTimeout(refreshCounts, delay + 2000));
  }, [refreshCounts, clearPending]);

  useEffect(() => {
    refreshCounts();

    const questionsSub = subscribeToAllQuestions(() => scheduleFetch(300));
    const messagesSub = subscribeToAllMessages(`${channelPrefix}-msgs`, () => scheduleFetch(600));
    const interval = setInterval(() => {
      if (Date.now() - lastManualUpdate.current > 5000) refreshCounts();
    }, 15000);

    const handleManualChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const threadId = detail?.id;
      const role = detail?.role;

      if (role === 'teacher' && selectedLectureId && threadId && !processedIds.current.has(threadId)) {
        processedIds.current.add(threadId);
        setUnreadCounts(prev => {
          const updated = { ...prev };
          if (updated[selectedLectureId] > 0) {
            updated[selectedLectureId] -= 1;
            if (updated[selectedLectureId] <= 0) delete updated[selectedLectureId];
          }
          return updated;
        });
        lastManualUpdate.current = Date.now();
      }
      scheduleFetch(3000);
    };
    window.addEventListener('unread-count-changed', handleManualChange);

    return () => {
      questionsSub.unsubscribe();
      messagesSub.unsubscribe();
      clearInterval(interval);
      clearPending();
      window.removeEventListener('unread-count-changed', handleManualChange);
    };
  }, [channelPrefix, selectedLectureId, refreshCounts, scheduleFetch, clearPending]);

  return { unreadCounts, setUnreadCounts };
};

// =====================================================
// Shared student unread-count hook
// Replaces duplicated logic in StudentLayoutWrapper
// =====================================================

export const useStudentUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let sub: any = null;

    const init = async () => {
      try {
        const { authApi } = await import('../api/authApi');
        const user = await authApi.getCurrentUser();
        if (!user) return;

        const count = await lectureQAApi.getStudentUnreadCount(user.id);
        setUnreadCount(count);

        const { subscribeToStudentQuestions } = await import('../services/realtimeService');
        sub = subscribeToStudentQuestions(user.id, `student-notif-${user.id}`, async () => {
          const c = await lectureQAApi.getStudentUnreadCount(user.id);
          setUnreadCount(c);
        });
      } catch (e) {
        console.error('Student unread init error:', e);
      }
    };
    init();

    const handleCountChange = async () => {
      try {
        const { authApi } = await import('../api/authApi');
        const user = await authApi.getCurrentUser();
        if (user) {
          const c = await lectureQAApi.getStudentUnreadCount(user.id);
          setUnreadCount(c);
        }
      } catch { /* ignore */ }
    };
    const handleDecrement = () => setUnreadCount(prev => Math.max(0, prev - 1));

    window.addEventListener('unread-count-changed', handleCountChange);
    window.addEventListener('unread-count-decrement', handleDecrement);

    return () => {
      window.removeEventListener('unread-count-changed', handleCountChange);
      window.removeEventListener('unread-count-decrement', handleDecrement);
      if (sub) sub.unsubscribe();
    };
  }, []);

  return { unreadCount };
};

// =====================================================
// What's New unread-count hook (student)
// Uses localStorage to track last-seen timestamp
// =====================================================

const WHATS_NEW_LAST_SEEN_KEY = 'whats_new_last_seen';

const getLastSeen = (): string | null => {
  try { return localStorage.getItem(WHATS_NEW_LAST_SEEN_KEY); } catch { return null; }
};

const setLastSeen = (ts: string) => {
  try { localStorage.setItem(WHATS_NEW_LAST_SEEN_KEY, ts); } catch { /* ignore */ }
};

export const useWhatsNewUnreadCount = () => {
  const [unreadNewsCount, setUnreadNewsCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const since = getLastSeen();
      const count = await whatsNewApi.getPublishedCountSince(since);
      setUnreadNewsCount(count);
    } catch (e) {
      console.error('Error fetching whats-new unread count:', e);
    }
  }, []);

  const markAllNewsSeen = useCallback(() => {
    setLastSeen(new Date().toISOString());
    setUnreadNewsCount(0);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);

    const newsSub = subscribeToWhatsNew(() => refresh());

    const handleSeen = () => {
      setUnreadNewsCount(0);
    };
    window.addEventListener('whats-new-seen', handleSeen);

    return () => {
      clearInterval(interval);
      newsSub.unsubscribe();
      window.removeEventListener('whats-new-seen', handleSeen);
    };
  }, [refresh]);

  return { unreadNewsCount, markAllNewsSeen };
};
