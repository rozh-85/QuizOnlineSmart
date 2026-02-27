// =====================================================
// Auth validation
// =====================================================

export interface LoginValidationResult {
  valid: boolean;
  error?: string;
}

export const validateStudentLogin = (serialId: string, pin: string): LoginValidationResult => {
  const cleanId = serialId.trim();
  if (!cleanId || !pin) {
    return { valid: false, error: 'Please enter both Serial ID and PIN' };
  }
  return { valid: true };
};

export const validateTeacherLogin = (email: string, password: string): LoginValidationResult => {
  if (!email.trim() || !password.trim()) {
    return { valid: false, error: 'Please enter both Email and Password' };
  }
  return { valid: true };
};
