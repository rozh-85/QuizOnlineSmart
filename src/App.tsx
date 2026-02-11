import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QuizProvider } from './context/QuizContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import TeacherDashboard from './pages/teacher/Dashboard';
import QuestionEditor from './pages/teacher/QuestionEditor';
import AIGenerator from './pages/teacher/AIGenerator';
import LectureManager from './pages/teacher/LectureManager';
import MaterialsManager from './pages/teacher/MaterialsManager';
import TeacherLogin from './pages/teacher/TeacherLogin';
import QuizStart from './pages/student/QuizStart';
import QuizQuestion from './pages/student/QuizQuestion';
import QuizResults from './pages/student/QuizResults';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = localStorage.getItem('teacher_auth') === 'true';
  return isAuth ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <QuizProvider>
      <HashRouter>
        <Toaster 
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#1e293b',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              fontWeight: 600,
              fontSize: '14px',
              padding: '12px 20px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: '#1d4ed8',
                secondary: '#ffffff',
              },
            },
          }}
        />
        <Routes>
          {/* Student Routes with Student Layout */}
          <Route path="/" element={<Layout showFooter={true}><Home /></Layout>} />
          <Route path="/quiz" element={<Layout><QuizStart /></Layout>} />
          <Route path="/quiz/question" element={<Layout><QuizQuestion /></Layout>} />
          <Route path="/quiz/results" element={<Layout><QuizResults /></Layout>} />
          
          {/* Admin Login (No Layout) */}
          <Route path="/admin/login" element={<Layout><TeacherLogin /></Layout>} />
          
          {/* Admin Routes with Admin Layout */}
          <Route 
            path="/admin" 
            element={<AdminLayout><ProtectedRoute><TeacherDashboard /></ProtectedRoute></AdminLayout>} 
          />
          <Route 
            path="/admin/lectures" 
            element={<AdminLayout><ProtectedRoute><LectureManager /></ProtectedRoute></AdminLayout>} 
          />
          <Route 
            path="/admin/materials" 
            element={<AdminLayout><ProtectedRoute><MaterialsManager /></ProtectedRoute></AdminLayout>} 
          />
          <Route 
            path="/admin/new" 
            element={<AdminLayout><ProtectedRoute><QuestionEditor /></ProtectedRoute></AdminLayout>} 
          />
          <Route 
            path="/admin/edit/:id" 
            element={<AdminLayout><ProtectedRoute><QuestionEditor /></ProtectedRoute></AdminLayout>} 
          />
          <Route 
            path="/admin/ai-generator" 
            element={<AdminLayout><ProtectedRoute><AIGenerator /></ProtectedRoute></AdminLayout>} 
          />
        </Routes>
      </HashRouter>
    </QuizProvider>
  );
}

export default App;
