import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, X, Lightbulb, CheckCircle, Flag, Gauge } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { useQuiz } from '../../context/QuizContext';

interface QuizState {
  currentIndex: number;
  selectedAnswer: number | string | null;
  isAnswered: boolean;
  score: number;
  answers: (number | string | null)[];
}

const QuizQuestion = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lectureId = searchParams.get('lectureId');
  const sectionName = searchParams.get('section');
  const { getQuestionsByLecture, getLecture, questions: allQuestions } = useQuiz();
  
  // Filter questions by lecture and optionally by section
  const questions = lectureId 
    ? getQuestionsByLecture(lectureId).filter(q => !sectionName || q.sectionId === sectionName)
    : allQuestions;
  const lecture = lectureId ? getLecture(lectureId) : null;
  
  const [state, setState] = useState<QuizState>({
    currentIndex: 0,
    selectedAnswer: null,
    isAnswered: false,
    score: 0,
    answers: [],
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (questions.length === 0) {
      navigate('/quiz');
    }
  }, [questions, navigate]);

  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Card className="p-12">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Flag size={32} className="text-slate-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">No Questions Available</h2>
          <p className="text-slate-500 font-bold mb-8">
            The quiz library is currently empty. Head over to the teacher dashboard to add some content.
          </p>
          <Link to="/teacher">
            <Button variant="primary" size="lg">Go to Teacher Panel</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[state.currentIndex];
  const isLastQuestion = state.currentIndex === questions.length - 1;

  const checkAnswer = (answer: number | string | null): boolean => {
    if (currentQuestion.type === 'blank') {
      if (typeof answer !== 'string') return false;
      return answer.trim().toLowerCase() === currentQuestion.correctAnswer?.trim().toLowerCase();
    }
    return answer === currentQuestion.correctIndex;
  };

  const isCorrect = checkAnswer(state.selectedAnswer);

  const handleAnswerSubmit = (answer: number | string) => {
    if (state.isAnswered) return;

    const correct = checkAnswer(answer);
    const newScore = correct ? state.score + 1 : state.score;

    setState(prev => ({
      ...prev,
      selectedAnswer: answer,
      isAnswered: true,
      score: newScore,
      answers: [...prev.answers, answer],
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Navigate to results with state
      navigate('/quiz/results', { 
        state: { 
          score: state.score, 
          total: questions.length,
          answers: state.answers,
          questions: questions, // Pass the actual quiz questions
          lectureId: lectureId, // Pass lectureId for "Try Again"
        } 
      });
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          currentIndex: prev.currentIndex + 1,
          selectedAnswer: null,
          isAnswered: false,
        }));
        setIsTransitioning(false);
      }, 300);
    }
  };


  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      {/* Breadcrumb & Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 line-clamp-1 mr-4">
            {lecture?.title || 'General Quiz'} {sectionName ? `• ${sectionName}` : ''}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 whitespace-nowrap">
            {Math.round(((state.currentIndex + 1) / questions.length) * 100)}% Complete
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden shadow-inner flex items-center">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 shadow-sm"
            style={{ width: `${((state.currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
              currentQuestion.difficulty === 'easy' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
              currentQuestion.difficulty === 'hard' ? 'bg-rose-50 border-rose-100 text-rose-600' :
              'bg-amber-50 border-amber-100 text-amber-600'
            }`}>
              <Gauge size={10} />
              {currentQuestion.difficulty || 'Medium'}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Question {state.currentIndex + 1} of {questions.length}</div>
          </div>
          {state.isAnswered && (
            <div className={`text-[11px] font-black uppercase tracking-widest ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </div>
          )}
        </div>
      </div>

      <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <Card className="mb-6 p-6 sm:p-10">
          {/* Question Text */}
          <h2 className="text-xl sm:text-2xl font-black leading-snug text-slate-900 tracking-tight mb-8 whitespace-pre-wrap">
            {currentQuestion.type === 'blank' && currentQuestion.text?.includes('_____') ? (
              currentQuestion.text.split('_____').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <input
                      type="text"
                      autoFocus
                      disabled={state.isAnswered}
                      className={`
                        inline-block px-4 py-1.5 mx-1 rounded-xl border-4 text-lg font-black transition-all outline-none align-middle
                        min-w-[120px] max-w-[200px] text-center
                        ${state.isAnswered 
                            ? (isCorrect 
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                                : 'bg-rose-50 border-rose-500 text-rose-700')
                            : 'bg-slate-50 border-slate-100 focus:border-primary-500 focus:bg-white text-slate-900 shadow-inner'}
                      `}
                      value={state.isAnswered ? (state.selectedAnswer as string) : undefined}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !state.isAnswered && e.currentTarget.value.trim()) {
                          handleAnswerSubmit(e.currentTarget.value.trim());
                        }
                      }}
                    />
                  )}
                </span>
              ))
            ) : currentQuestion.text}
          </h2>

          {/* Multiple Choice Options */}
          {currentQuestion.type === 'multiple-choice' && (
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, index) => {
                const isSelected = index === state.selectedAnswer;
                const isCorrectOpt = index === currentQuestion.correctIndex;
                
                let borderColor = 'border-slate-100';
                let bgColor = 'bg-white';
                let textColor = 'text-slate-600';
                let statusLabel = null;

                if (state.isAnswered) {
                  if (isCorrectOpt) {
                    borderColor = 'border-emerald-500';
                    bgColor = 'bg-emerald-50/30';
                    textColor = 'text-emerald-700';
                    statusLabel = 'Correct Answer';
                  } else if (isSelected && !isCorrect) {
                    borderColor = 'border-error-500';
                    bgColor = 'bg-error-50/30';
                    textColor = 'text-error-600';
                    statusLabel = 'Incorrect';
                  } else {
                    bgColor = 'bg-slate-50/50';
                    textColor = 'text-slate-400';
                  }
                } else {
                  borderColor = 'border-slate-100 hover:border-primary-300';
                  bgColor = 'bg-white hover:bg-primary-50/10';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSubmit(index)}
                    disabled={state.isAnswered}
                    className={`
                      w-full text-left p-4 sm:p-5 rounded-2xl border-2 font-bold text-sm sm:text-base
                      transition-smooth flex items-center justify-between
                      ${borderColor} ${bgColor} ${textColor}
                      ${!state.isAnswered ? 'cursor-pointer hover:border-primary-400 hover:-translate-y-0.5' : ''}
                      ${state.isAnswered && isCorrectOpt ? 'scale-[1.02] shadow-xl shadow-emerald-100 border-emerald-500 animate-success-glow' : ''}
                      ${state.isAnswered && isSelected && !isCorrect ? 'animate-shake' : ''}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`
                        w-9 h-9 rounded-xl flex items-center justify-center font-black flex-shrink-0 transition-colors
                        ${state.isAnswered && isCorrectOpt ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-500'}
                      `}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="leading-tight">{option}</span>
                    </div>
                    
                    {statusLabel && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                        isCorrectOpt ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      } shadow-md animate-scale-in`}>
                        <span className="text-[10px] font-black uppercase tracking-widest">{statusLabel}</span>
                        {isCorrectOpt ? <CheckCircle size={14} className="fill-white/20" /> : <X size={14} className="fill-white/20" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* True / False Options - Simple & User-Friendly */}
          {currentQuestion.type === 'true-false' && (
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              {[0, 1].map((index) => {
                const label = index === 0 ? 'True' : 'False';
                const isSelected = index === state.selectedAnswer;
                const isCorrectOpt = index === currentQuestion.correctIndex;
                
                let borderColor = 'border-slate-200';
                let bgColor = 'bg-white';
                let textColor = 'text-slate-600';

                if (state.isAnswered) {
                  if (isSelected) {
                    borderColor = isCorrect ? 'border-emerald-500' : 'border-rose-500';
                    bgColor = isCorrect ? 'bg-emerald-500 text-white shadow-md' : 'bg-rose-500 text-white shadow-md';
                    textColor = 'text-white';
                  } else if (isCorrectOpt) {
                    borderColor = 'border-emerald-500';
                    bgColor = 'bg-emerald-50 text-emerald-600';
                    textColor = 'text-emerald-700';
                  } else {
                    bgColor = 'bg-slate-50/50';
                    textColor = 'text-slate-300';
                    borderColor = 'border-slate-100';
                  }
                } else {
                  borderColor = 'border-slate-200 hover:border-primary-400';
                  bgColor = 'bg-white hover:bg-primary-50/10';
                  textColor = 'text-slate-700';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSubmit(index)}
                    disabled={state.isAnswered}
                    className={`
                      flex-1 py-4 px-6 rounded-2xl border-2 font-bold text-base transition-all flex items-center justify-center gap-3
                      ${borderColor} ${bgColor} ${textColor}
                      ${!state.isAnswered ? 'hover:shadow-sm' : ''}
                      ${state.isAnswered && isCorrectOpt ? 'animate-success-glow' : ''}
                      ${state.isAnswered && isSelected && !isCorrect ? 'animate-shake' : ''}
                    `}
                  >
                    {state.isAnswered && isCorrectOpt ? <CheckCircle size={18} /> : 
                     state.isAnswered && isSelected && !isCorrect ? <X size={18} /> : null}
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Fill in the Blank (Standalone) - Clean & Centered */}
          {currentQuestion.type === 'blank' && !currentQuestion.text.includes('_____') && (
            <div className="mb-8 max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder="Type your answer..."
                  disabled={state.isAnswered}
                  className={`
                    w-full px-6 py-4 rounded-2xl border-2 text-lg font-bold transition-all outline-none text-center
                    ${state.isAnswered 
                        ? (isCorrect 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'bg-rose-50 border-rose-500 text-rose-700')
                        : 'bg-slate-50 border-slate-200 focus:border-primary-500 focus:bg-white text-slate-900 shadow-inner'}
                  `}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !state.isAnswered && e.currentTarget.value.trim()) {
                      handleAnswerSubmit(e.currentTarget.value.trim());
                    }
                  }}
                />
                {!state.isAnswered && (
                  <p className="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                    Press Enter to submit
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Correct Answer reveal for failed blanks */}
          {currentQuestion.type === 'blank' && state.isAnswered && !isCorrect && (
            <div className="mt-4 mb-8 p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block leading-none mb-1">Correct Answer</span>
                  <span className="text-lg font-black text-emerald-700 leading-none">{currentQuestion.correctAnswer || 'None set'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for unknown/legacy types if somehow triggered */}
          {!['multiple-choice', 'true-false', 'blank'].includes(currentQuestion.type) && (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
               <p className="text-slate-500 font-bold">This question format is not supported.</p>
            </div>
          )}

          {/* Explanation */}
          {state.isAnswered && currentQuestion.explanation && (
            <div className="animate-fade-in py-6 border-t border-slate-100">
              <div className="p-6 rounded-2xl bg-primary-50 border border-primary-100">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                    <Lightbulb size={18} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-primary-900 mb-2 uppercase tracking-widest">Explanation</h4>
                    <p className="text-slate-700 text-sm leading-relaxed font-semibold">
                      {currentQuestion.explanation}
                    </p>
                    <button className="mt-4 text-[11px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                      Review Lesson: Cellular Organelles
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4">
          <button className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors">
            <Flag size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Report Issue</span>
          </button>
          
          <Button 
            onClick={handleNext} 
            disabled={!state.isAnswered}
            size="lg"
            className="px-10 h-14 rounded-xl shadow-lg shadow-primary-200"
          >
            {isLastQuestion ? 'View Summary' : 'Next Question'}
            <ArrowRight size={20} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;
