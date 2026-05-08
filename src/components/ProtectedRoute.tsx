import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { ROUTES } from '../constants/routes';
import { getPrototypeAuthSession } from '../utils/authSession';

type Role = 'root' | 'teacher' | 'student' | 'admin';
const STAFF_ROLES: Role[] = ['root', 'teacher', 'admin'];

const isStaffRole = (role: Role | null): boolean => {
  return !!role && STAFF_ROLES.includes(role);
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const [role, setRole] = useState<Role | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const prototypeSession = getPrototypeAuthSession();
  const hasSupabaseToken = Object.keys(localStorage).some(
    key => key.startsWith('sb-') && key.endsWith('-auth-token') && key !== 'sb-prototype-auth-token'
  );
  const hasToken = !!prototypeSession || hasSupabaseToken;

  useEffect(() => {
    const checkRole = async () => {
      if (!hasToken) {
        setRole(null);
        setCheckingRole(false);
        return;
      }

      try {
        if (prototypeSession) {
          setRole(prototypeSession.role);
          return;
        }

        const user = await authApi.getCurrentUser();
        if (!user) {
          setRole(null);
          return;
        }

        const profile = await authApi.getProfile(user.id);
        setRole((profile?.role as Role) || null);
      } catch {
        setRole(null);
      } finally {
        setCheckingRole(false);
      }
    };

    checkRole();
  }, [hasToken, prototypeSession?.role]);

  const isAdminRoute = allowedRoles?.some((allowedRole) => STAFF_ROLES.includes(allowedRole));

  if (!hasToken) {
    return <Navigate to={isAdminRoute ? ROUTES.ADMIN_LOGIN : ROUTES.LOGIN} replace />;
  }

  if (checkingRole) return null;

  if (allowedRoles?.length && (!role || !allowedRoles.includes(role))) {
    if (isAdminRoute) {
      return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
    }

    return <Navigate to={isStaffRole(role) ? ROUTES.ADMIN : ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
