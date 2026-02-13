import { useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { Trophy, RotateCcw, Home, Star, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Button, Card, Modal } from '../../components/ui';
import { Question } from '../../types';

interface LocationState {
  score: number;
  total: number;
  answers: (number | string | null)[];
  questions: Question[];
  lectureId?: string | null;
}

const QuizResults = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [quickViewItem, setQuickViewItem] = useState<{question: Question, index: number, isCorrect: boolean} | null>(null);

  if (!state) {
    return <Navigate to="/dashboard" replace />;
  }

  const { score, total, answers, questions, lectureId } = state;
  const percentage = Math.round((score / total) * 100);

  const getGrade = () => {
    if (percentage >= 90) return { label: 'Excellent!', color: 'text-emerald-400', emoji: '🏆' };
    if (percentage >= 70) return { label: 'Great Job!', color: 'text-green-400', emoji: '🌟' };
    if (percentage >= 50) return { label: 'Good Effort!', color: 'text-yellow-400', emoji: '👍' };
    return { label: 'Keep Practicing!', color: 'text-orange-400', emoji: '💪' };
  };

  const grade = getGrade();

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-6 xl:px-10 py-4 lg:py-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: Performance Metrics */}
        <div className="lg:w-[380px] xl:w-[420px] flex-shrink-0">
          <Card className="p-6 lg:p-10 sticky lg:top-24 gap-8 flex flex-col items-center text-center shadow-xl border-slate-100" glow>
            {/* Grade & Achievement */}
            <div>
              <div className="relative inline-block mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary-600 flex items-center justify-center shadow-xl shadow-primary-200/50">
                  <Trophy size={32} className="text-white sm:size-[40px]" />
                </div>
              </div>
              <h1 className={`text-2xl sm:text-4xl font-black mb-1 lg:mb-2 tracking-tighter ${grade.color}`}>
                {grade.label}
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm font-bold leading-relaxed">
                Module Completed!
              </p>
            </div>

            {/* Score Circle */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 xl:w-48 xl:h-48 mx-auto flex items-center justify-center">
              {/* Simplistic Padded Background Circle */}
              <div className="absolute inset-2 bg-slate-50/50 rounded-full border border-slate-100/50 shadow-inner" />
              
              <svg viewBox="0 0 100 100" className="relative w-full h-full transform -rotate-90 drop-shadow-sm">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="5"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="238.76"
                  strokeDashoffset={238.76 - (238.76 * percentage) / 100}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-none">{percentage}%</span>
                <span className="text-slate-400 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mt-1">
                  Correct Rate
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="w-full grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-lg font-black text-slate-900 leading-none">{total}</div>
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Items</div>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="text-lg font-black text-emerald-600 leading-none">{score}</div>
                <div className="text-[8px] font-bold text-emerald-500/70 uppercase tracking-widest mt-1">Pass</div>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                <div className="text-lg font-black text-rose-600 leading-none">{total - score}</div>
                <div className="text-[8px] font-bold text-rose-500/70 uppercase tracking-widest mt-1">Fail</div>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full space-y-3">
              <Link 
                to={lectureId ? `/quiz/question?lectureId=${lectureId}` : '/quiz/question'} 
                className="block w-full"
              >
                <Button variant="primary" fullWidth className="h-12 rounded-xl shadow-lg shadow-primary-200/50">
                  <RotateCcw size={18} />
                  Try Again
                </Button>
              </Link>
              <Link to="/dashboard" className="block w-full">
                <Button variant="secondary" fullWidth className="h-12 rounded-xl border-slate-200 bg-white">
                  <Home size={18} />
                  Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Answer Review */}
        <div className="flex-1 min-w-0">
          <Card className="p-6 lg:p-10 h-full border-slate-100 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                <Star size={24} className="text-yellow-400 fill-yellow-400" />
                Review Session
              </h3>
              <div className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest">
                {questions.length} Questions
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-4">
              {questions.map((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = question.type === 'blank'
                  ? (typeof userAnswer === 'string' && userAnswer.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase())
                  : userAnswer === question.correctIndex;
                
                return (
                  <div 
                    key={question.id}
                    className={`p-4 xl:p-5 rounded-2xl border-2 transition-all group relative ${
                      isCorrect 
                        ? 'bg-white border-slate-100 shadow-sm' 
                        : 'bg-rose-50/30 border-rose-100/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm
                        ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}
                      `}>
                        {isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                      </div>

                      <button 
                        onClick={() => setQuickViewItem({question, index, isCorrect})}
                        className={`absolute top-4 right-4 p-2 rounded-lg transition-all active:scale-95 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-10 ${
                          isCorrect 
                            ? 'bg-primary-50 text-primary-600 hover:bg-primary-100' 
                            : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        }`}
                        title="Quick View"
                      >
                        <Eye size={16} />
                      </button>

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {index + 1}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mb-3 leading-snug">
                          {question.text}
                        </p>
                        <div className="grid grid-cols-1 gap-2 p-2.5 rounded-xl bg-white/60 border border-slate-100">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Commitment</p>
                            <p className={`text-xs font-bold truncate ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {userAnswer !== null 
                                ? (question.type === 'blank' ? userAnswer : question.options[userAnswer as number]) 
                                : 'Skipped'}
                            </p>
                          </div>
                          {!isCorrect && (
                            <div className="pt-1 border-t border-slate-100/50">
                              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Correct Protocol</p>
                              <p className="text-xs font-bold text-emerald-600 truncate">
                                {question.type === 'blank' 
                                  ? (question.correctAnswer || 'N/A')
                                  : (question.options ? question.options[question.correctIndex!] : 'N/A')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick View Modal - Redesigned to match Student Preview */}
      {quickViewItem && (
        <Modal 
          isOpen={true} 
          onClose={() => setQuickViewItem(null)}
          title={`Question Inspection: #${quickViewItem.index + 1}`}
        >
          <div className="p-0">
            <div className="bg-white p-6 border-b border-slate-100">
               <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${
                    quickViewItem.isCorrect ? 'bg-emerald-500 shadow-emerald-100' : 'bg-rose-500 shadow-rose-100'
                  }`}>
                    {quickViewItem.isCorrect ? <CheckCircle size={24} /> : <XCircle size={24} />}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Analytical View</h4>
                    <p className={`text-sm font-black uppercase tracking-tight ${
                      quickViewItem.isCorrect ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {quickViewItem.isCorrect ? 'Correct Submission' : 'Analysis Required'}
                    </p>
                  </div>
               </div>
               <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight whitespace-pre-wrap">
                 {quickViewItem.question.type === 'blank' && quickViewItem.question.text.includes('_____') ? (
                   quickViewItem.question.text.split('_____').map((part, i, arr) => (
                     <span key={i}>
                       {part}
                       {i < arr.length - 1 && (
                         <span className={`inline-block px-2 py-0.5 mx-1 rounded-lg border-2 min-w-[60px] text-center text-xs align-middle ${
                           quickViewItem.isCorrect 
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-600' 
                            : 'border-rose-100 bg-rose-50 text-rose-600'
                         }`}>
                           {state.answers[quickViewItem.index] || '...'}
                         </span>
                       )}
                     </span>
                   ))
                 ) : quickViewItem.question.text}
               </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Options Section */}
              <div className="space-y-2">
                {quickViewItem.question.type === 'multiple-choice' && quickViewItem.question.options.map((option, oIdx) => {
                  const isUserAnswer = state.answers[quickViewItem.index] === oIdx;
                  const isCorrectAnswer = quickViewItem.question.correctIndex === oIdx;
                  
                  return (
                    <div
                      key={oIdx}
                      className={`px-4 py-3 rounded-xl border-2 flex items-center gap-4 transition-all ${
                        isCorrectAnswer
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                          : isUserAnswer
                            ? 'bg-rose-50 border-rose-400 text-rose-700'
                            : 'bg-white border-slate-50 opacity-60'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black ${
                        isCorrectAnswer ? 'bg-emerald-500 text-white' : 
                        isUserAnswer ? 'bg-rose-500 text-white' : 
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="text-sm font-bold flex-1">{option}</span>
                      {isCorrectAnswer && <CheckCircle size={16} className="text-emerald-500" />}
                      {isUserAnswer && !isCorrectAnswer && <XCircle size={16} className="text-rose-500" />}
                    </div>
                  );
                })}

                {quickViewItem.question.type === 'true-false' && (
                  <div className="flex gap-3">
                    {['True', 'False'].map((label, index) => {
                      const isUserAnswer = state.answers[quickViewItem.index] === index;
                      const isCorrectAnswer = quickViewItem.question.correctIndex === index;
                      
                      return (
                        <div
                          key={label}
                          className={`flex-1 py-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                            isCorrectAnswer
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                              : isUserAnswer
                                ? 'bg-rose-50 border-rose-400 text-rose-700'
                                : 'bg-white border-slate-50 opacity-60'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCorrectAnswer ? 'bg-emerald-500 text-white' : 
                            isUserAnswer ? 'bg-rose-500 text-white' : 'bg-slate-100'
                          }`}>
                            {isCorrectAnswer ? <CheckCircle size={16} /> : 
                             isUserAnswer ? <XCircle size={16} /> : null}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {quickViewItem.question.type === 'blank' && (
                  <div className="space-y-3">
                    <div className={`p-4 rounded-2xl border-2 ${quickViewItem.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Your Input</p>
                      <p className={`text-lg font-black ${quickViewItem.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {state.answers[quickViewItem.index] || 'Skipped'}
                      </p>
                    </div>
                    {!quickViewItem.isCorrect && (
                      <div className="p-4 rounded-2xl border-2 bg-emerald-50 border-emerald-400 shadow-sm shadow-emerald-100">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Correct Protocol</p>
                        <p className="text-lg font-black text-emerald-700">
                          {quickViewItem.question.correctAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

               {quickViewItem.question.explanation && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2">Logic Rationale</h4>
                  <p className="text-[11px] font-medium text-slate-500 leading-snug">
                    {quickViewItem.question.explanation}
                  </p>
                </div>
              )}

              <Button fullWidth size="lg" onClick={() => setQuickViewItem(null)} className="h-14 font-black uppercase tracking-widest text-xs">
                Close Inspection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default QuizResults;
