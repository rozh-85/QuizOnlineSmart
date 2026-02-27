import { useState, useCallback } from 'react';
import { authApi } from '../api/authApi';
import type { Profile } from '../types/database';

// =====================================================
// Auth hook
// =====================================================

export const useAuth = () => {
  const [loading, setLoading] = useState(false);

  const getCurrentUser = useCallback(async () => {
    return authApi.getCurrentUser();
  }, []);

  const getProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    return authApi.getProfile(userId);
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.signOut();
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, getCurrentUser, getProfile, signOut };
};
