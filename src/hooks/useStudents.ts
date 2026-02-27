import { useState, useEffect, useCallback } from 'react';
import { studentApi } from '../api/studentApi';
import { classApi } from '../api/classApi';
import toast from 'react-hot-toast';

// =====================================================
// Students data hook
// =====================================================

export const useStudents = (selectedClassId: string = 'all') => {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const classData = await classApi.getAll();
      setClasses(classData);

      let studentData;
      if (selectedClassId === 'all') {
        studentData = await studentApi.getAll();
      } else {
        studentData = await classApi.getClassStudents(selectedClassId);
      }
      setStudents(studentData);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { students, classes, loading, setLoading, refetch: fetchData };
};
