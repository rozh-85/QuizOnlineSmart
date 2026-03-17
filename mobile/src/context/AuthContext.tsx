import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string, fingerprint?: string) => Promise<void>;
  signInWithSerial: (serialId: string, pin: string, fingerprint: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signInWithSerial: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const p = await authApi.getProfile(userId);
      setProfile(p);
    } catch (e) {
      console.error('Failed to fetch profile:', e);
    }
  }, []);

  useEffect(() => {
    // Check existing session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string, fingerprint?: string) => {
    const result = await authApi.signIn(email, password, fingerprint);
    setUser(result.user);
    setProfile(result.profile);
  };

  const signInWithSerial = async (serialId: string, pin: string, fingerprint: string) => {
    const result = await authApi.signInWithSerial(serialId, pin, fingerprint);
    setUser(result.user);
    setProfile(result.profile);
  };

  const signOut = async () => {
    await authApi.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInWithSerial, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
