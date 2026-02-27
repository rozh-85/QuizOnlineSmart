import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Question } from '../types/app';
import { questionApi } from '../api/questionApi';
import { subscribeToQuestions } from '../services/realtimeService';
import { adaptQuestion } from '../utils/adapters';

interface QuestionContextType {
  questions: Question[];
  addQuestion: (question: Omit<Question, 'id'>) => Promise<void>;
  updateQuestion: (id: string, question: Omit<Question, 'id'>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  getQuestion: (id: string) => Question | undefined;
  getQuestionsByLecture: (lectureId: string) => Question[];
  toggleQuestionVisibility: (id: string, isVisible: boolean) => Promise<void>;
  loading: boolean;
}

const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export const QuestionProvider = ({ children }: { children: ReactNode }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuestions = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await questionApi.getAll();
      setQuestions(data.map(adaptQuestion));
    } catch (err) {
      console.error('Failed to load questions:', err);
      throw err;
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => { loadQuestions(true); }, [loadQuestions]);

  useEffect(() => {
    const sub = subscribeToQuestions(() => loadQuestions());
    return () => { sub.unsubscribe(); };
  }, [loadQuestions]);

  const addQuestion = useCallback(async (q: Omit<Question, 'id'>) => {
    await questionApi.create({
      text: q.text,
      type: q.type as any,
      difficulty: q.difficulty as any,
      options: q.options || [],
      correct_index: q.correctIndex ?? null,
      correct_answer: q.correctAnswer ?? null,
      explanation: q.explanation ?? null,
      lecture_id: q.lectureId ?? null,
      section_id: q.sectionId ?? null,
      is_visible: q.isVisible ?? true,
    });
  }, []);

  const updateQuestion = useCallback(async (id: string, q: Omit<Question, 'id'>) => {
    await questionApi.update(id, {
      text: q.text,
      type: q.type as any,
      difficulty: q.difficulty as any,
      options: q.options || [],
      correct_index: q.correctIndex ?? null,
      correct_answer: q.correctAnswer ?? null,
      explanation: q.explanation ?? null,
      lecture_id: q.lectureId ?? null,
      section_id: q.sectionId ?? null,
      is_visible: q.isVisible ?? true,
    });
  }, []);

  const toggleQuestionVisibility = useCallback(async (id: string, isVisible: boolean) => {
    await questionApi.update(id, { is_visible: isVisible });
    await loadQuestions();
  }, [loadQuestions]);

  const deleteQuestion = useCallback(async (id: string) => {
    await questionApi.delete(id);
  }, []);

  const getQuestion = useCallback((id: string) => questions.find(q => q.id === id), [questions]);

  const getQuestionsByLecture = useCallback(
    (lectureId: string) => questions.filter(q => q.lectureId === lectureId),
    [questions]
  );

  return (
    <QuestionContext.Provider value={{
      questions, addQuestion, updateQuestion, deleteQuestion,
      getQuestion, getQuestionsByLecture, toggleQuestionVisibility, loading,
    }}>
      {children}
    </QuestionContext.Provider>
  );
};

export const useQuestionContext = () => {
  const ctx = useContext(QuestionContext);
  if (!ctx) throw new Error('useQuestionContext must be used within a QuestionProvider');
  return ctx;
};
