// =====================================================
// Class validation
// =====================================================

export interface ClassValidationResult {
  valid: boolean;
  error?: string;
}

export const validateClassName = (name: string): ClassValidationResult => {
  if (!name.trim()) {
    return { valid: false, error: 'Class name is required' };
  }
  return { valid: true };
};

export const validateAttendanceSession = (classId: string, teacherId: string | null): ClassValidationResult => {
  if (!classId || !teacherId) {
    return { valid: false, error: 'Please select a class' };
  }
  return { valid: true };
};
