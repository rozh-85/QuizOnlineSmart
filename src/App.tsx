import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QuizProvider } from './context/QuizContext';
import AdminLayout from './components/AdminLayout';
import StudentLayoutWrapper from './components/StudentLayoutWrapper';
import Login from './pages/Login';
import TeacherDashboard from './pages/teacher/Dashboard';
import ClassManager from './pages/teacher/ClassManager';
import StudentManager from './pages/teacher/StudentManager';
import QuestionEditor from './pages/teacher/QuestionEditor';
import AIGenerator from './pages/teacher/AIGenerator';
import ExamBuilder from './pages/teacher/ExamBuilder';
import Attendance from './pages/teacher/Attendance';
import Reports from './pages/teacher/Reports';
import AttendanceScan from './pages/student/AttendanceScan';
import LectureManager from './pages/teacher/LectureManager';
import MaterialsManager from './pages/teacher/MaterialsManager';
import QAManager from './pages/teacher/QAManager';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentNews from './pages/student/StudentNews';
import StudentQRScan from './pages/student/StudentQRScan';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentProfile from './pages/student/StudentProfile';
import LectureDetail from './pages/student/LectureDetail';
import QuizStart from './pages/student/QuizStart';
import QuizQuestion from './pages/student/QuizQuestion';
import QuizResults from './pages/student/QuizResults';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: ('teacher' | 'student' | 'admin')[] }) => {
  const hasToken = Object.keys(localStorage).some(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
  
  if (!hasToken) {
    const isAdminRoute = allowedRoles?.includes('teacher') || allowedRoles?.includes('admin');
    return <Navigate to={isAdminRoute ? "/admin/login" : "/login"} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QuizProvider>
      <HashRouter>
        <div className="min-h-screen bg-slate-50 font-inter antialiased">
          <Routes>
            {/* Root - Redirect to Login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Auth */}
            <Route path="/login" element={<Login mode="student" />} />
            <Route path="/admin/login" element={<Login mode="teacher" />} />
            
            {/* Student Routes with StudentLayout */}
            <Route 
              path="/dashboard" 
              element={<ProtectedRoute allowedRoles={['student']}><StudentLayoutWrapper><StudentDashboard /></StudentLayoutWrapper></ProtectedRoute>} 
            />
            <Route 
              path="/news" 
              element={<ProtectedRoute allowedRoles={['student']}><StudentLayoutWrapper><StudentNews /></StudentLayoutWrapper></ProtectedRoute>} 
            />
            <Route 
              path="/scan" 
              element={<ProtectedRoute allowedRoles={['student']}><StudentLayoutWrapper><StudentQRScan /></StudentLayoutWrapper></ProtectedRoute>} 
            />
            <Route 
              path="/notifications" 
              element={<ProtectedRoute allowedRoles={['student']}><StudentLayoutWrapper><StudentNotifications /></StudentLayoutWrapper></ProtectedRoute>} 
            />
            <Route 
              path="/profile" 
              element={<ProtectedRoute allowedRoles={['student']}><StudentLayoutWrapper><StudentProfile /></StudentLayoutWrapper></ProtectedRoute>} 
            />
            <Route 
              path="/lecture/:id" 
              element={<ProtectedRoute allowedRoles={['student']}><StudentLayoutWrapper><LectureDetail /></StudentLayoutWrapper></ProtectedRoute>} 
            />
            <Route 
              path="/quiz" 
              element={<ProtectedRoute allowedRoles={['student']}><StudentLayoutWrapper><QuizStart /></StudentLayoutWrapper></ProtectedRoute>} 
            />
            <Route 
              path="/quiz/:lectureId" 
              element={<ProtectedRoute allowedRoles={['student']}><StudentLayoutWrapper><QuizStart /></StudentLayoutWrapper></ProtectedRoute>} 
            />
            <Route 
              path="/quiz/question" 
              element={<ProtectedRoute allowedRoles={['student']}><StudentLayoutWrapper><QuizQuestion /></StudentLayoutWrapper></ProtectedRoute>} 
            />
            <Route 
              path="/quiz/results" 
              element={<ProtectedRoute allowedRoles={['student']}><StudentLayoutWrapper><QuizResults /></StudentLayoutWrapper></ProtectedRoute>} 
            />
            
            {/* Admin Routes with Admin Layout */}
            <Route 
              path="/admin" 
              element={<AdminLayout><ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherDashboard /></ProtectedRoute></AdminLayout>} 
            />
            <Route 
              path="/admin/classes" 
              element={<AdminLayout><ProtectedRoute allowedRoles={['teacher', 'admin']}><ClassManager /></ProtectedRoute></AdminLayout>} 
            />
            <Route 
              path="/admin/students" 
              element={<AdminLayout><ProtectedRoute allowedRoles={['teacher', 'admin']}><StudentManager /></ProtectedRoute></AdminLayout>} 
            />
            <Route 
              path="/admin/lectures" 
              element={<AdminLayout><ProtectedRoute allowedRoles={['teacher', 'admin']}><LectureManager /></ProtectedRoute></AdminLayout>} 
            />
            <Route 
              path="/admin/materials" 
              element={<AdminLayout><ProtectedRoute allowedRoles={['teacher', 'admin']}><MaterialsManager /></ProtectedRoute></AdminLayout>} 
            />
            <Route 
              path="/admin/qa" 
              element={<AdminLayout><ProtectedRoute allowedRoles={['teacher', 'admin']}><QAManager /></ProtectedRoute></AdminLayout>} 
            />
            <Route 
              path="/admin/new" 
              element={<AdminLayout><ProtectedRoute allowedRoles={['teacher', 'admin']}><QuestionEditor /></ProtectedRoute></AdminLayout>} 
            />
            <Route 
              path="/admin/edit/:id" 
              element={<AdminLayout><ProtectedRoute allowedRoles={['teacher', 'admin']}><QuestionEditor /></ProtectedRoute></AdminLayout>} 
            />
            <Route 
              path="/admin/ai-generator" 
              element={<AdminLayout><ProtectedRoute allowedRoles={['teacher', 'admin']}><AIGenerator /></ProtectedRoute></AdminLayout>} 
            />
            <Route 
              path="/admin/exam-builder" 
              element={<AdminLayout><ProtectedRoute allowedRoles={['teacher', 'admin']}><ExamBuilder /></ProtectedRoute></AdminLayout>} 
            />
            <Route 
              path="/admin/attendance" 
              element={<AdminLayout><ProtectedRoute allowedRoles={['teacher', 'admin']}><Attendance /></ProtectedRoute></AdminLayout>} 
            />
            <Route 
              path="/admin/reports" 
              element={<AdminLayout><ProtectedRoute allowedRoles={['teacher', 'admin']}><Reports /></ProtectedRoute></AdminLayout>} 
            />

            {/* Student Attendance Scan */}
            <Route 
              path="/attend/:token" 
              element={<AttendanceScan />} 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster 
            position="top-center"
            toastOptions={{
              className: 'font-bold text-sm rounded-2xl shadow-2xl border border-slate-100 p-4',
              duration: 4000,
            }}
          />
        </div>
      </HashRouter>
    </QuizProvider>
  );
}

export default App;
