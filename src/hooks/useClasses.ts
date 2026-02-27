import { useState, useEffect, useCallback } from 'react';
import { classApi } from '../api/classApi';
import toast from 'react-hot-toast';

// =====================================================
// Classes data hook
// =====================================================

export const useClasses = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await classApi.getAll();
      setClasses(data);
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return { classes, loading, setLoading, refetch: fetchClasses };
};
