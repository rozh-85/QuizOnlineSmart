// =====================================================
// BACKWARD-COMPATIBLE SHIM
// =====================================================
// This file re-exports everything from the new layered modules
// so that existing imports from '../services/supabaseService' keep working.
// New code should import directly from '../api/*' and '../services/realtimeService'.

// API layer re-exports (old names → new names)
export { attendanceApi as attendanceService } from '../api/attendanceApi';
export { authApi as authService } from '../api/authApi';
export { classApi as classService } from '../api/classApi';
export { studentApi as studentService } from '../api/studentApi';
export { lectureApi as lectureService } from '../api/lectureApi';
export { questionApi as questionService } from '../api/questionApi';
export { materialApi as materialService } from '../api/materialApi';
export { lectureQAApi as lectureQAService } from '../api/lectureQAApi';
export { reportApi as reportService } from '../api/reportApi';

// Realtime subscriptions
export {
  subscribeToLectures,
  subscribeToQuestions,
  subscribeToMaterials,
  subscribeToLectureQuestions,
  subscribeToQuestionMessages,
  subscribeToAllQuestions,
} from '../services/realtimeService';

// localStorage helpers
export { getTeacherReadMap, addTeacherReadTimestamp } from '../utils/localStorage';
