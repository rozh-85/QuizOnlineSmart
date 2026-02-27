import { useState, useEffect, ReactNode } from 'react';
import { LectureProvider, useLectureContext } from './LectureContext';
import { QuestionProvider, useQuestionContext } from './QuestionContext';
import { MaterialProvider, useMaterialContext } from './MaterialContext';
import { lectureApi } from '../api/lectureApi';

// ── Composed provider that wraps all three domain contexts ──
export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    lectureApi.getAll()
      .then(() => setReady(true))
      .catch((err: any) => {
        console.error('Database connection failed:', err);
        setError(err.message || 'Could not connect to Supabase. Make sure you have run the SQL schema.');
      });
  }, []);

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

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-100 h-14 flex items-center px-6 gap-4">
          <div className="w-8 h-8 rounded-lg bg-slate-200/60 animate-pulse" />
          <div className="w-24 h-4 rounded bg-slate-200/60 animate-pulse" />
          <div className="flex-1" />
          <div className="w-9 h-9 rounded-xl bg-slate-200/60 animate-pulse" />
        </div>
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

  return (
    <LectureProvider>
      <QuestionProvider>
        <MaterialProvider>
          {children}
        </MaterialProvider>
      </QuestionProvider>
    </LectureProvider>
  );
};

// ── Backward-compatible hook that composes all three contexts ──
export const useQuiz = () => {
  const lecture = useLectureContext();
  const question = useQuestionContext();
  const material = useMaterialContext();

  return {
    lectures: lecture.lectures,
    addLecture: lecture.addLecture,
    updateLecture: lecture.updateLecture,
    deleteLecture: lecture.deleteLecture,
    getLecture: lecture.getLecture,

    questions: question.questions,
    addQuestion: question.addQuestion,
    updateQuestion: question.updateQuestion,
    deleteQuestion: question.deleteQuestion,
    getQuestion: question.getQuestion,
    getQuestionsByLecture: question.getQuestionsByLecture,
    toggleQuestionVisibility: question.toggleQuestionVisibility,

    materials: material.materials,
    addMaterial: material.addMaterial,
    updateMaterial: material.updateMaterial,
    deleteMaterial: material.deleteMaterial,
    getMaterialsByLecture: material.getMaterialsByLecture,
  };
};
