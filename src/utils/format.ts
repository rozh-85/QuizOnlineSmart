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
