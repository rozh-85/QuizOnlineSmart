export type PrototypeRole = 'root' | 'admin' | 'teacher';

export interface PrototypeAuthSession {
  access_token: 'prototype';
  email: string;
  role: PrototypeRole;
}

const PROTOTYPE_AUTH_KEY = 'sb-prototype-auth-token';

export const getPrototypeAuthSession = (): PrototypeAuthSession | null => {
  try {
    const rawSession = localStorage.getItem(PROTOTYPE_AUTH_KEY);
    if (!rawSession) return null;

    const session = JSON.parse(rawSession) as Partial<PrototypeAuthSession>;
    if (session.access_token !== 'prototype') return null;
    if (session.role !== 'root' && session.role !== 'admin' && session.role !== 'teacher') return null;

    return {
      access_token: 'prototype',
      email: session.email || 'prototype@local',
      role: session.role,
    };
  } catch {
    localStorage.removeItem(PROTOTYPE_AUTH_KEY);
    return null;
  }
};

export const setPrototypeAuthSession = (email: string, role: PrototypeRole) => {
  const session: PrototypeAuthSession = {
    access_token: 'prototype',
    email,
    role,
  };

  localStorage.setItem(PROTOTYPE_AUTH_KEY, JSON.stringify(session));
};

export const clearAuthSessionStorage = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      localStorage.removeItem(key);
    }
  });
  localStorage.removeItem('teacher_auth');
};
