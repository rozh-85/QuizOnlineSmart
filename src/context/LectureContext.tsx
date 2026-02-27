import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Lecture } from '../types/app';
import { lectureApi } from '../api/lectureApi';
import { subscribeToLectures } from '../services/realtimeService';
import { adaptLecture } from '../utils/adapters';

interface LectureContextType {
  lectures: Lecture[];
  addLecture: (lecture: Omit<Lecture, 'id' | 'createdAt'>) => Promise<void>;
  updateLecture: (id: string, lecture: Omit<Lecture, 'id' | 'createdAt'>) => Promise<void>;
  deleteLecture: (id: string) => Promise<void>;
  getLecture: (id: string) => Lecture | undefined;
  loading: boolean;
  reload: () => Promise<void>;
}

const LectureContext = createContext<LectureContextType | undefined>(undefined);

export const LectureProvider = ({ children }: { children: ReactNode }) => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLectures = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await lectureApi.getAll();
      setLectures(data.map(adaptLecture));
    } catch (err) {
      console.error('Failed to load lectures:', err);
      throw err;
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => { loadLectures(true); }, [loadLectures]);

  useEffect(() => {
    const sub = subscribeToLectures(() => loadLectures());
    return () => { sub.unsubscribe(); };
  }, [loadLectures]);

  const addLecture = useCallback(async (l: Omit<Lecture, 'id' | 'createdAt'>) => {
    await lectureApi.create({
      title: l.title,
      description: l.description || null,
      sections: l.sections || [],
      order_index: l.order || 0,
    });
  }, []);

  const updateLecture = useCallback(async (id: string, l: Omit<Lecture, 'id' | 'createdAt'>) => {
    await lectureApi.update(id, {
      title: l.title,
      description: l.description || null,
      sections: l.sections || [],
      order_index: l.order || 0,
    });
  }, []);

  const deleteLecture = useCallback(async (id: string) => {
    await lectureApi.delete(id);
  }, []);

  const getLecture = useCallback((id: string) => lectures.find(l => l.id === id), [lectures]);

  return (
    <LectureContext.Provider value={{ lectures, addLecture, updateLecture, deleteLecture, getLecture, loading, reload: () => loadLectures() }}>
      {children}
    </LectureContext.Provider>
  );
};

export const useLectureContext = () => {
  const ctx = useContext(LectureContext);
  if (!ctx) throw new Error('useLectureContext must be used within a LectureProvider');
  return ctx;
};
