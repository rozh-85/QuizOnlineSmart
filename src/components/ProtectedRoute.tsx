import { Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

type Role = 'teacher' | 'student' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const hasToken = Object.keys(localStorage).some(
    key => key.startsWith('sb-') && key.endsWith('-auth-token')
  );

  if (!hasToken) {
    const isAdminRoute = allowedRoles?.includes('teacher') || allowedRoles?.includes('admin');
    return <Navigate to={isAdminRoute ? ROUTES.ADMIN_LOGIN : ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
