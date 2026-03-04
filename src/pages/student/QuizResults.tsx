import { useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { Trophy, RotateCcw, Home, Star, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [quickViewItem, setQuickViewItem] = useState<{question: Question, index: number, isCorrect: boolean} | null>(null);

  if (!state) {
    return <Navigate to="/dashboard" replace />;
  }

  const { score, total, answers, questions, lectureId } = state;
  const percentage = Math.round((score / total) * 100);

  const getGrade = () => {
    if (percentage >= 90) return { label: t('quiz.excellent'), color: 'text-emerald-400', emoji: '🏆' };
    if (percentage >= 70) return { label: t('quiz.greatJob'), color: 'text-green-400', emoji: '🌟' };
    if (percentage >= 50) return { label: t('quiz.goodEffort'), color: 'text-yellow-400', emoji: '👍' };
    return { label: t('quiz.keepPracticing'), color: 'text-orange-400', emoji: '💪' };
  };

  const grade = getGrade();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 lg:px-6 py-5 pb-8 lg:py-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-5">
        
        {/* LEFT COLUMN: Performance Metrics */}
        <div className="lg:w-[360px] flex-shrink-0">
          <Card className="p-6 lg:p-8 sticky lg:top-20 gap-6 flex flex-col items-center text-center border-slate-200">
            {/* Grade */}
            <div>
              <Trophy size={32} className="text-primary-500 mx-auto mb-3" />
              <h1 className={`text-2xl sm:text-3xl font-bold mb-1 ${grade.color}`}>
                {grade.label}
              </h1>
              <p className="text-sm text-slate-500">{t('quiz.quizCompleted')}</p>
            </div>

            {/* Score Circle */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="#2563eb" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray="251.33"
                  strokeDashoffset={251.33 - (251.33 * percentage) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-bold text-slate-900 leading-none">{percentage}%</span>
                <span className="text-xs text-slate-400 mt-1">{t('quiz.correct')}</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="w-full grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-slate-50 text-center">
                <div className="text-lg font-bold text-slate-900">{total}</div>
                <div className="text-xs text-slate-500">{t('quiz.total')}</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 text-center">
                <div className="text-lg font-bold text-emerald-600">{score}</div>
                <div className="text-xs text-emerald-600">{t('quiz.correct')}</div>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 text-center">
                <div className="text-lg font-bold text-rose-600">{total - score}</div>
                <div className="text-xs text-rose-600">{t('quiz.wrong')}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full space-y-2.5">
              <Link 
                to={lectureId ? `/quiz/question?lectureId=${lectureId}` : '/quiz/question'} 
                className="block w-full"
              >
                <Button variant="primary" fullWidth className="h-11 rounded-lg">
                  <RotateCcw size={16} />
                  {t('quiz.tryAgain')}
                </Button>
              </Link>
              <Link to="/dashboard" className="block w-full">
                <Button variant="secondary" fullWidth className="h-11 rounded-lg border-slate-200 bg-white">
                  <Home size={16} />
                  {t('nav.dashboard')}
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Answer Review */}
        <div className="flex-1 min-w-0">
          <Card className="p-5 lg:p-8 h-full border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Star size={20} className="text-yellow-400 fill-yellow-400" />
                {t('quiz.answerReview')}
              </h3>
              <span className="text-xs text-slate-400">{t('student.questionsCount', { count: questions.length })}</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {questions.map((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = question.type === 'blank'
                  ? (typeof userAnswer === 'string' && userAnswer.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase())
                  : userAnswer === question.correctIndex;
                
                return (
                  <div 
                    key={question.id}
                    className={`p-4 rounded-xl border transition-all group relative ${
                      isCorrect 
                        ? 'bg-white border-slate-200' 
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white
                        ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}
                      `}>
                        {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>

                      <button 
                        onClick={() => setQuickViewItem({question, index, isCorrect})}
                        className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all active:scale-95 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-10 ${
                          isCorrect 
                            ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                            : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                        }`}
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>

                      <div className="flex-1 min-w-0 pr-6">
                        <span className="text-xs text-slate-400 font-medium">{t('quiz.question')} {index + 1}</span>
                        <p className="text-sm font-medium text-slate-900 mb-2 leading-snug line-clamp-2">
                          {question.text}
                        </p>
                        <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50/80 border border-slate-100">
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium mb-0.5">{t('quiz.yourAnswer')}</p>
                            <p className={`text-xs font-medium truncate ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {userAnswer !== null 
                                ? (question.type === 'blank' ? userAnswer : question.options[userAnswer as number]) 
                                : t('quiz.skipped')}
                            </p>
                          </div>
                          {!isCorrect && (
                            <div className="pt-1.5 border-t border-slate-100">
                              <p className="text-[10px] text-emerald-500 font-medium mb-0.5">{t('quiz.correctAnswer')}</p>
                              <p className="text-xs font-medium text-emerald-600 truncate">
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

      {/* Quick View Modal */}
      {quickViewItem && (
        <Modal 
          isOpen={true} 
          onClose={() => setQuickViewItem(null)}
          title={`Question ${quickViewItem.index + 1}`}
        >
          <div className="p-0">
            <div className="p-5 border-b border-slate-100">
               <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                    quickViewItem.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}>
                    {quickViewItem.isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  </div>
                  <span className={`text-sm font-semibold ${
                    quickViewItem.isCorrect ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {quickViewItem.isCorrect ? t('quiz.correct') : t('quiz.incorrect')}
                  </span>
               </div>
               <h3 className="text-base font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                 {quickViewItem.question.type === 'blank' && quickViewItem.question.text.includes('_____') ? (
                   quickViewItem.question.text.split('_____').map((part, i, arr) => (
                     <span key={i}>
                       {part}
                       {i < arr.length - 1 && (
                         <span className={`inline-block px-2 py-0.5 mx-1 rounded border-2 min-w-[50px] text-center text-xs align-middle ${
                           quickViewItem.isCorrect 
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600' 
                            : 'border-rose-200 bg-rose-50 text-rose-600'
                         }`}>
                           {state.answers[quickViewItem.index] || '...'}
                         </span>
                       )}
                     </span>
                   ))
                 ) : quickViewItem.question.text}
               </h3>
            </div>

            <div className="p-5 space-y-4">
              {/* Options Section */}
              <div className="space-y-2">
                {quickViewItem.question.type === 'multiple-choice' && quickViewItem.question.options.map((option, oIdx) => {
                  const isUserAnswer = state.answers[quickViewItem.index] === oIdx;
                  const isCorrectAnswer = quickViewItem.question.correctIndex === oIdx;
                  
                  return (
                    <div
                      key={oIdx}
                      className={`px-3.5 py-2.5 rounded-lg border-2 flex items-center gap-3 ${
                        isCorrectAnswer
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : isUserAnswer
                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                            : 'bg-white border-slate-100 text-slate-400'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                        isCorrectAnswer ? 'bg-emerald-500 text-white' : 
                        isUserAnswer ? 'bg-rose-500 text-white' : 
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="text-sm font-medium flex-1">{option}</span>
                      {isCorrectAnswer && <CheckCircle size={15} className="text-emerald-500" />}
                      {isUserAnswer && !isCorrectAnswer && <XCircle size={15} className="text-rose-500" />}
                    </div>
                  );
                })}

                {quickViewItem.question.type === 'true-false' && (
                  <div className="flex gap-2.5">
                    {[t('quiz.true'), t('quiz.false')].map((label, index) => {
                      const isUserAnswer = state.answers[quickViewItem.index] === index;
                      const isCorrectAnswer = quickViewItem.question.correctIndex === index;
                      
                      return (
                        <div
                          key={label}
                          className={`flex-1 py-3 rounded-xl border-2 flex flex-col items-center gap-1.5 ${
                            isCorrectAnswer
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : isUserAnswer
                                ? 'bg-rose-50 border-rose-300 text-rose-700'
                                : 'bg-white border-slate-100 text-slate-400'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            isCorrectAnswer ? 'bg-emerald-500 text-white' : 
                            isUserAnswer ? 'bg-rose-500 text-white' : 'bg-slate-100'
                          }`}>
                            {isCorrectAnswer ? <CheckCircle size={14} /> : 
                             isUserAnswer ? <XCircle size={14} /> : null}
                          </div>
                          <span className="text-xs font-semibold">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {quickViewItem.question.type === 'blank' && (
                  <div className="space-y-2">
                    <div className={`p-3.5 rounded-xl border ${quickViewItem.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                      <p className="text-xs text-slate-500 mb-1">{t('quiz.yourAnswer')}</p>
                      <p className={`text-base font-semibold ${quickViewItem.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {state.answers[quickViewItem.index] || t('quiz.skipped')}
                      </p>
                    </div>
                    {!quickViewItem.isCorrect && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <p className="text-xs text-emerald-600 mb-1">{t('quiz.correctAnswer')}</p>
                        <p className="text-base font-semibold text-emerald-700">
                          {quickViewItem.question.correctAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

               {quickViewItem.question.explanation && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-700 mb-1.5">{t('quiz.explanation')}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {quickViewItem.question.explanation}
                  </p>
                </div>
              )}

              <Button fullWidth size="lg" onClick={() => setQuickViewItem(null)} className="h-11 rounded-lg font-semibold text-sm">
                {t('common.close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default QuizResults;
