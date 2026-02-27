import { useState, useEffect, useCallback } from 'react';
import { lectureApi } from '../api/lectureApi';
import type { Lecture } from '../types/database';
import toast from 'react-hot-toast';

// =====================================================
// Lectures data hook
// =====================================================

export const useLectures = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLectures = useCallback(async () => {
    try {
      setLoading(true);
      const data = await lectureApi.getAll();
      setLectures(data);
    } catch (error) {
      toast.error('Failed to load lectures');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  return { lectures, loading, refetch: fetchLectures };
};
