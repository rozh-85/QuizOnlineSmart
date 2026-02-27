// =====================================================
// App-wide constants
// =====================================================

export const EMAIL_DOMAIN = '@kimya.com';

export const QR_REFRESH_INTERVAL_MS = 5000;
export const QR_TOKEN_EXPIRY_MS = 4000;

export const ATTENDANCE_POLL_INTERVAL_MS = 3000;

export const SPLASH_MIN_VIEW_MS = 1500;

export const TOAST_DURATION_MS = 4000;
export const TOAST_LONG_DURATION_MS = 6000;

export const MIN_PIN_LENGTH = 4;

export const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-1.0-pro',
  'gemini-pro',
] as const;
