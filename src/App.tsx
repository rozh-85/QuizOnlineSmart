import { Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { QuizProvider } from './context/QuizContext';
import AdminLayout from './components/AdminLayout';
import StudentLayoutWrapper from './components/StudentLayoutWrapper';
import ProtectedRoute from './components/ProtectedRoute';
import { authRoutes, studentRoutes, adminRoutes, publicRoutes } from './routes';
import { ROUTES, TOAST_DURATION_MS } from './constants';
import { RTL_LANGUAGES } from './i18n';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isRTL = RTL_LANGUAGES.includes(i18n.language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <QuizProvider>
      <HashRouter>
        <div className="min-h-screen bg-slate-50 font-inter antialiased">
          <Suspense fallback={null}>
            <Routes>
              {/* Root → Login */}
              <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

              {/* Auth (no protection) */}
              {authRoutes.map(({ path, element }) => (
                <Route key={path} path={path} element={element} />
              ))}

              {/* Student routes → StudentLayoutWrapper + ProtectedRoute */}
              {studentRoutes.map(({ path, element, roles }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ProtectedRoute allowedRoles={roles}>
                      <StudentLayoutWrapper>{element}</StudentLayoutWrapper>
                    </ProtectedRoute>
                  }
                />
              ))}

              {/* Admin routes → AdminLayout + ProtectedRoute */}
              {adminRoutes.map(({ path, element, roles }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <AdminLayout>
                      <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>
                    </AdminLayout>
                  }
                />
              ))}

              {/* Public routes (no layout) */}
              {publicRoutes.map(({ path, element }) => (
                <Route key={path} path={path} element={element} />
              ))}

              {/* Fallback */}
              <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
            </Routes>
          </Suspense>
          <Toaster
            position="top-center"
            toastOptions={{
              className: 'font-bold text-sm rounded-2xl shadow-2xl border border-slate-100 p-4',
              duration: TOAST_DURATION_MS,
            }}
          />
        </div>
      </HashRouter>
    </QuizProvider>
  );
}

export default App;
