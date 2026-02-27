// =====================================================
// Route path constants
// =====================================================

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  ADMIN_LOGIN: '/admin/login',

  // Student
  DASHBOARD: '/dashboard',
  NEWS: '/news',
  SCAN: '/scan',
  CHAT: '/chat',
  PROFILE: '/profile',
  LECTURE_DETAIL: '/lecture/:id',
  QUIZ: '/quiz',
  QUIZ_BY_LECTURE: '/quiz/:lectureId',
  QUIZ_QUESTION: '/quiz/question',
  QUIZ_RESULTS: '/quiz/results',
  ATTEND_TOKEN: '/attend/:token',

  // Admin / Teacher
  ADMIN: '/admin',
  ADMIN_CLASSES: '/admin/classes',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_LECTURES: '/admin/lectures',
  ADMIN_MATERIALS: '/admin/materials',
  ADMIN_QA: '/admin/qa',
  ADMIN_NEW_QUESTION: '/admin/new',
  ADMIN_EDIT_QUESTION: '/admin/edit/:id',
  ADMIN_AI_GENERATOR: '/admin/ai-generator',
  ADMIN_EXAM_BUILDER: '/admin/exam-builder',
  ADMIN_ATTENDANCE: '/admin/attendance',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_WHATS_NEW: '/admin/whats-new',
} as const;
