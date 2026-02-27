// =====================================================
// Formatting utilities
// =====================================================

export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const formatHoursAttended = (joinedAt: string, endedAt: string): number => {
  const joined = new Date(joinedAt).getTime();
  const ended = new Date(endedAt).getTime();
  return Math.round(((ended - joined) / (1000 * 60 * 60)) * 100) / 100;
};

export const formatDuration = (hours: number): string => {
  if (!hours || hours <= 0) return '0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const formatTimeOfDay = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateShort = (dateStr: string): string => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getSessionDurationHours = (session: { started_at?: string; ended_at?: string }): number => {
  if (!session.started_at || !session.ended_at) return 0;
  const start = new Date(session.started_at).getTime();
  const end = new Date(session.ended_at).getTime();
  return Math.max(0, (end - start) / (1000 * 60 * 60));
};

export const getSessionEndTime = (session: { ended_at?: string; records?: { time_left?: string }[] }): string | null => {
  const records = session.records || [];
  const timesLeft = records
    .filter((r) => r.time_left)
    .map((r) => new Date(r.time_left!).getTime());
  if (timesLeft.length === 0) return session.ended_at || null;
  return new Date(Math.max(...timesLeft)).toISOString();
};
