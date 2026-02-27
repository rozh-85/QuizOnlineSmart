import { MIN_PIN_LENGTH } from '../constants/app';

// =====================================================
// Student validation
// =====================================================

export interface StudentValidationResult {
  valid: boolean;
  error?: string;
}

export const validateCreateStudent = (fullName: string, serialId: string, pin: string): StudentValidationResult => {
  if (!fullName || !serialId || !pin) {
    return { valid: false, error: 'Required fields missing' };
  }
  return { valid: true };
};

export const validatePasswordChange = (newPassword: string): StudentValidationResult => {
  if (!newPassword) {
    return { valid: false, error: 'Please enter a new password' };
  }
  if (newPassword.length < MIN_PIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PIN_LENGTH} characters` };
  }
  return { valid: true };
};
