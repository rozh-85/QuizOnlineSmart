// =====================================================
// ID generation utilities
// =====================================================

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const generateToken = (sessionId: string): string => {
  const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  const raw = `${sessionId}-${random}-${timestamp}`;
  // Simple hash: convert to base36 encoded string
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `${Math.abs(hash).toString(36)}-${random}-${timestamp}`;
};

export const generateFileName = (originalName: string): string => {
  const fileExt = originalName.split('.').pop();
  return `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
};
