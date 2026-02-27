// =====================================================
// Material validation
// =====================================================

export interface MaterialValidationResult {
  valid: boolean;
  error?: string;
}

export const validateMaterial = (title: string, lectureId: string): MaterialValidationResult => {
  if (!title || !lectureId) {
    return { valid: false, error: 'Please fill in required fields' };
  }
  return { valid: true };
};
