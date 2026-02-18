import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Question as LocalQuestion, Lecture as LocalLecture, QuizContextType } from '../types';
import { lectureService, questionService, materialService, subscribeToLectures, subscribeToQuestions, subscribeToMaterials } from '../services/supabaseService';
import type { Lecture as SupabaseLecture, Question as SupabaseQuestion, LectureMaterial as SupabaseMaterial } from '../lib/supabase';

const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Type adapters
const adaptLecture = (lecture: SupabaseLecture): LocalLecture => ({
  id: lecture.id,
  title: lecture.title,
  description: lecture.description || '',
  sections: lecture.sections || [],
  order: lecture.order_index,
  createdAt: lecture.created_at
});

const adaptQuestion = (question: SupabaseQuestion): LocalQuestion => ({
  id: question.id,
  text: question.text,
  type: question.type as any,
  difficulty: question.difficulty as any,
  options: question.options || [],
  correctIndex: question.correct_index ?? undefined,
  correctAnswer: question.correct_answer ?? undefined,
  explanation: question.explanation ?? undefined,
  lectureId: question.lecture_id ?? undefined,
  sectionId: question.section_id ?? undefined,
  isVisible: question.is_visible ?? true
});

const adaptMaterial = (material: SupabaseMaterial): any => ({
  id: material.id,
  title: material.title,
  content: material.content || undefined,
  fileUrl: material.file_url || undefined,
  fileName: material.file_name || undefined,
  fileType: material.file_type as any,
  lectureId: material.lecture_id || undefined,
  sectionId: material.section_id || undefined,
  createdAt: material.created_at
});

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [lectures, setLectures] = useState<LocalLecture[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError(null);
      
      const [lecturesData, questionsData, materialsData] = await Promise.all([
        lectureService.getAll(),
        questionService.getAll(),
        materialService.getAll()
      ]);

      setLectures(lecturesData.map(adaptLecture));
      setQuestions(questionsData.map(adaptQuestion));
      setMaterials(materialsData.map(adaptMaterial));
    } catch (err: any) {
      console.error('Database connection failed:', err);
      if (isInitial) setError(err.message || 'Could not connect to Supabase. Make sure you have run the SQL schema.');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  useEffect(() => {
    const lSub = subscribeToLectures(() => loadData());
    const qSub = subscribeToQuestions(() => loadData());
    const mSub = subscribeToMaterials(() => loadData());
    return () => {
      lSub.unsubscribe();
      qSub.unsubscribe();
      mSub.unsubscribe();
    };
  }, []);

  const addQuestion = async (q: Omit<LocalQuestion, 'id'>) => {
    await questionService.create({
      text: q.text,
      type: q.type as any,
      difficulty: q.difficulty as any,
      options: q.options || [],
      correct_index: q.correctIndex ?? null,
      correct_answer: q.correctAnswer ?? null,
      explanation: q.explanation ?? null,
      lecture_id: q.lectureId ?? null,
      section_id: q.sectionId ?? null,
      is_visible: q.isVisible ?? true
    });
  };

  const updateQuestion = async (id: string, q: Omit<LocalQuestion, 'id'>) => {
    await questionService.update(id, {
      text: q.text,
      type: q.type as any,
      difficulty: q.difficulty as any,
      options: q.options || [],
      correct_index: q.correctIndex ?? null,
      correct_answer: q.correctAnswer ?? null,
      explanation: q.explanation ?? null,
      lecture_id: q.lectureId ?? null,
      section_id: q.sectionId ?? null,
      is_visible: q.isVisible ?? true
    });
  };

  const toggleQuestionVisibility = async (id: string, isVisible: boolean) => {
    await questionService.update(id, { is_visible: isVisible });
    await loadData();
  };

  const deleteQuestion = async (id: string) => {
    await questionService.delete(id);
  };

  const addLecture = async (l: Omit<LocalLecture, 'id' | 'createdAt'>) => {
    await lectureService.create({
      title: l.title,
      description: l.description || null,
      sections: l.sections || [],
      order_index: l.order || 0
    });
  };

  const updateLecture = async (id: string, l: Omit<LocalLecture, 'id' | 'createdAt'>) => {
    await lectureService.update(id, {
      title: l.title,
      description: l.description || null,
      sections: l.sections || [],
      order_index: l.order || 0
    });
  };

  const deleteLecture = async (id: string) => {
    await lectureService.delete(id);
  };

  const getQuestion = (id: string) => questions.find(q => q.id === id);
  const getLecture = (id: string) => lectures.find(l => l.id === id);
  const getQuestionsByLecture = (id: string) => questions.filter(q => q.lectureId === id);

  const addMaterial = async (m: any) => {
    await materialService.create({
      title: m.title,
      content: m.content || null,
      file_url: m.fileUrl || null,
      file_name: m.fileName || null,
      file_type: m.fileType,
      lecture_id: m.lectureId || null,
      section_id: m.sectionId || null
    });
    await loadData();
  };

  const updateMaterial = async (id: string, m: any) => {
    await materialService.update(id, {
      title: m.title,
      content: m.content || null,
      file_url: m.fileUrl || null,
      file_name: m.fileName || null,
      file_type: m.fileType,
      lecture_id: m.lectureId || null,
      section_id: m.sectionId || null
    });
    await loadData();
  };

  const deleteMaterial = async (id: string) => {
    await materialService.delete(id);
    await loadData();
  };

  const getMaterialsByLecture = (lectureId: string, sectionId?: string) => {
    return materials.filter(m => 
      m.lectureId === lectureId && (!sectionId || m.sectionId === sectionId)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Skeleton top bar */}
        <div className="bg-white border-b border-slate-100 h-14 flex items-center px-6 gap-4">
          <div className="w-8 h-8 rounded-lg bg-slate-200/60 animate-pulse" />
          <div className="w-24 h-4 rounded bg-slate-200/60 animate-pulse" />
          <div className="flex-1" />
          <div className="w-9 h-9 rounded-xl bg-slate-200/60 animate-pulse" />
        </div>
        {/* Skeleton body */}
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-6 rounded-lg bg-slate-200/60 animate-pulse" />
            <div className="w-72 h-10 rounded-lg bg-slate-200/60 animate-pulse" />
            <div className="w-64 h-4 rounded bg-slate-200/60 animate-pulse" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {[1,2,3].map(i => (
              <div key={i} className="h-56 rounded-[2rem] bg-white border border-slate-100 p-7 space-y-4 animate-pulse">
                <div className="flex justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-200/60" />
                  <div className="w-20 h-6 rounded-full bg-slate-200/60" />
                </div>
                <div className="w-3/4 h-5 rounded bg-slate-200/60" />
                <div className="w-full h-4 rounded bg-slate-200/60" />
                <div className="w-1/2 h-4 rounded bg-slate-200/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-rose-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-4">Database Connection Required</h2>
          <p className="text-slate-600 mb-6 text-sm">{error}</p>
          <div className="bg-slate-50 p-4 rounded-xl text-left text-xs font-mono text-slate-500 mb-6 border border-slate-100">
            1. Copy 'supabase_schema.sql'<br/>
            2. Run in Supabase SQL Editor<br/>
            3. Click Refresh below
          </div>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all">Refresh App</button>
        </div>
      </div>
    );
  }

  return (
    <QuizContext.Provider value={{ 
      questions, lectures, materials, addQuestion, updateQuestion, deleteQuestion, 
      getQuestion, getQuestionsByLecture, toggleQuestionVisibility, addLecture, updateLecture, deleteLecture, getLecture,
      addMaterial, updateMaterial, deleteMaterial, getMaterialsByLecture
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) throw new Error('useQuiz must be used within a QuizProvider');
  return context;
};
