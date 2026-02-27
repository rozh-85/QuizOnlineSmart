import { STORAGE_KEYS } from '../constants/storage';

// =====================================================
// Teacher read-tracking (localStorage safety net)
// =====================================================
// Stores { threadId: isoTimestamp } so that even if the DB update for
// is_read fails (e.g. RLS), the count functions can filter them out.
// A thread is considered "read" only if the stored timestamp is >= the
// thread's updated_at (i.e. no new student activity since the teacher read it).

export const getTeacherReadMap = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHER_READ_THREADS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const addTeacherReadTimestamp = (id: string) => {
  try {
    const map = getTeacherReadMap();
    map[id] = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.TEACHER_READ_THREADS, JSON.stringify(map));
  } catch {
    // best-effort
  }
};

/** Returns true if this thread should still count as unread for the teacher */
export const isStillUnread = (threadId: string, threadUpdatedAt: string, readMap: Record<string, string>): boolean => {
  const readAt = readMap[threadId];
  if (!readAt) return true; // never read locally
  // If the thread was updated (new student message) after the teacher read it, it's unread again
  return new Date(threadUpdatedAt) > new Date(readAt);
};
