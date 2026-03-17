import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { lectureApi } from '../api/lectureApi';
import { questionApi } from '../api/questionApi';
import { materialApi } from '../api/materialApi';
import { adaptLecture, adaptQuestion, adaptMaterial } from '../utils/adapters';
import { subscribeToLectures, subscribeToQuestions, subscribeToMaterials } from '../services/realtimeService';
import { useAuth } from './AuthContext';
import type { Lecture, Question, Material } from '../types/app';

interface DataState {
  lectures: Lecture[];
  questions: Question[];
  materials: Material[];
  loading: boolean;
  refresh: () => Promise<void>;
  getQuestionsByLecture: (lectureId: string) => Question[];
  getMaterialsByLecture: (lectureId: string) => Material[];
}

const DataContext = createContext<DataState>({
  lectures: [],
  questions: [],
  materials: [],
  loading: true,
  refresh: async () => {},
  getQuestionsByLecture: () => [],
  getMaterialsByLecture: () => [],
});

export const useData = () => useContext(DataContext);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [rawLectures, rawQuestions, rawMaterials] = await Promise.all([
        lectureApi.getAll(),
        questionApi.getAll(),
        materialApi.getAll(),
      ]);
      setLectures(rawLectures.map(adaptLecture));
      setQuestions(rawQuestions.map(adaptQuestion));
      setMaterials(rawMaterials.map(adaptMaterial));
    } catch (e) {
      console.error('Data fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLectures([]);
      setQuestions([]);
      setMaterials([]);
      setLoading(false);
      return;
    }

    fetchAll();

    // Real-time subscriptions
    const lectureSub = subscribeToLectures(() => fetchAll());
    const questionSub = subscribeToQuestions(() => fetchAll());
    const materialSub = subscribeToMaterials(() => fetchAll());

    return () => {
      lectureSub.unsubscribe();
      questionSub.unsubscribe();
      materialSub.unsubscribe();
    };
  }, [user, fetchAll]);

  const getQuestionsByLecture = useCallback(
    (lectureId: string) => questions.filter(q => q.lectureId === lectureId && q.isVisible !== false),
    [questions]
  );

  const getMaterialsByLecture = useCallback(
    (lectureId: string) => materials.filter(m => m.lectureId === lectureId),
    [materials]
  );

  return (
    <DataContext.Provider value={{ lectures, questions, materials, loading, refresh: fetchAll, getQuestionsByLecture, getMaterialsByLecture }}>
      {children}
    </DataContext.Provider>
  );
};
