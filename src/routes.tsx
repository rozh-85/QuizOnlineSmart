import { lazy, type ReactNode } from 'react';
import { ROUTES } from './constants/routes';

// Lazy-loaded pages
const Login = lazy(() => import('./pages/Login'));
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const ClassManager = lazy(() => import('./pages/teacher/ClassManager'));
const StudentManager = lazy(() => import('./pages/teacher/StudentManager'));
const QuestionEditor = lazy(() => import('./pages/teacher/QuestionEditor'));
const AIGenerator = lazy(() => import('./pages/teacher/AIGenerator'));
const ExamBuilder = lazy(() => import('./pages/teacher/ExamBuilder'));
const Attendance = lazy(() => import('./pages/teacher/Attendance'));
const Reports = lazy(() => import('./pages/teacher/Reports'));
const LectureManager = lazy(() => import('./pages/teacher/LectureManager'));
const MaterialsManager = lazy(() => import('./pages/teacher/MaterialsManager'));
const QAManager = lazy(() => import('./pages/teacher/QAManager'));
const AttendanceScan = lazy(() => import('./pages/student/AttendanceScan'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentNews = lazy(() => import('./pages/student/StudentNews'));
const StudentQRScan = lazy(() => import('./pages/student/StudentQRScan'));
const StudentNotifications = lazy(() => import('./pages/student/StudentNotifications'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));
const LectureDetail = lazy(() => import('./pages/student/LectureDetail'));
const QuizStart = lazy(() => import('./pages/student/QuizStart'));
const QuizQuestion = lazy(() => import('./pages/student/QuizQuestion'));
const QuizResults = lazy(() => import('./pages/student/QuizResults'));

// ── Route type definitions ──────────────────────────────
type Role = 'teacher' | 'student' | 'admin';

export interface AppRoute {
  path: string;
  element: ReactNode;
  roles: Role[];
}

// ── Auth routes (no protection) ─────────────────────────
export const authRoutes: { path: string; element: ReactNode }[] = [
  { path: ROUTES.LOGIN, element: <Login mode="student" /> },
  { path: ROUTES.ADMIN_LOGIN, element: <Login mode="teacher" /> },
];

// ── Student routes (wrapped in StudentLayoutWrapper) ────
export const studentRoutes: AppRoute[] = [
  { path: ROUTES.DASHBOARD, element: <StudentDashboard />, roles: ['student'] },
  { path: ROUTES.NEWS, element: <StudentNews />, roles: ['student'] },
  { path: ROUTES.SCAN, element: <StudentQRScan />, roles: ['student'] },
  { path: ROUTES.CHAT, element: <StudentNotifications />, roles: ['student'] },
  { path: ROUTES.PROFILE, element: <StudentProfile />, roles: ['student'] },
  { path: ROUTES.LECTURE_DETAIL, element: <LectureDetail />, roles: ['student'] },
  { path: ROUTES.QUIZ, element: <QuizStart />, roles: ['student'] },
  { path: ROUTES.QUIZ_BY_LECTURE, element: <QuizStart />, roles: ['student'] },
  { path: ROUTES.QUIZ_QUESTION, element: <QuizQuestion />, roles: ['student'] },
  { path: ROUTES.QUIZ_RESULTS, element: <QuizResults />, roles: ['student'] },
];

// ── Admin/Teacher routes (wrapped in AdminLayout) ───────
export const adminRoutes: AppRoute[] = [
  { path: ROUTES.ADMIN, element: <TeacherDashboard />, roles: ['teacher', 'admin'] },
  { path: ROUTES.ADMIN_CLASSES, element: <ClassManager />, roles: ['teacher', 'admin'] },
  { path: ROUTES.ADMIN_STUDENTS, element: <StudentManager />, roles: ['teacher', 'admin'] },
  { path: ROUTES.ADMIN_LECTURES, element: <LectureManager />, roles: ['teacher', 'admin'] },
  { path: ROUTES.ADMIN_MATERIALS, element: <MaterialsManager />, roles: ['teacher', 'admin'] },
  { path: ROUTES.ADMIN_QA, element: <QAManager />, roles: ['teacher', 'admin'] },
  { path: ROUTES.ADMIN_NEW_QUESTION, element: <QuestionEditor />, roles: ['teacher', 'admin'] },
  { path: ROUTES.ADMIN_EDIT_QUESTION, element: <QuestionEditor />, roles: ['teacher', 'admin'] },
  { path: ROUTES.ADMIN_AI_GENERATOR, element: <AIGenerator />, roles: ['teacher', 'admin'] },
  { path: ROUTES.ADMIN_EXAM_BUILDER, element: <ExamBuilder />, roles: ['teacher', 'admin'] },
  { path: ROUTES.ADMIN_ATTENDANCE, element: <Attendance />, roles: ['teacher', 'admin'] },
  { path: ROUTES.ADMIN_REPORTS, element: <Reports />, roles: ['teacher', 'admin'] },
];

// ── Public routes (no layout wrapper) ───────────────────
export const publicRoutes: AppRoute[] = [
  { path: ROUTES.ATTEND_TOKEN, element: <AttendanceScan />, roles: [] },
];
