import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, X, Lightbulb, CheckCircle, Flag, Gauge, ArrowLeft } from 'lucide-react';
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
  
  // Filter questions by lecture and optionally by section, and only show visible questions
  const questions = (lectureId 
    ? getQuestionsByLecture(lectureId).filter(q => !sectionName || q.sectionId === sectionName)
    : allQuestions
  ).filter(q => q.isVisible !== false);
  const lecture = lectureId ? getLecture(lectureId) : null;
  
  const [state, setState] = useState<QuizState>({
    currentIndex: 0,
    selectedAnswer: null,
    isAnswered: false,
    score: 0,
    answers: [],
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleExit = () => {
    if (lectureId) {
      navigate(`/quiz?lectureId=${lectureId}`);
    } else {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    if (questions.length === 0) {
      navigate('/dashboard');
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
    <div className="max-w-3xl mx-auto px-4 py-5 sm:py-8">
      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Leave Quiz?</h3>
            <p className="text-sm text-slate-500 mb-6">Your progress will be lost. You've answered {state.currentIndex} of {questions.length} questions.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExit}
                className="flex-1 py-2.5 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
              >
                Leave Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExitConfirm(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary-600 hover:border-primary-300 transition-all"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="text-xs font-medium text-slate-500 line-clamp-1">
              {lecture?.title || 'General Quiz'} {sectionName ? `· ${sectionName}` : ''}
            </span>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {state.currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div 
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${((state.currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {currentQuestion.difficulty && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                currentQuestion.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' :
                currentQuestion.difficulty === 'hard' ? 'bg-rose-50 text-rose-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                <Gauge size={11} />
                {currentQuestion.difficulty}
              </span>
            )}
          </div>
          {state.isAnswered && (
            <span className={`text-xs font-semibold ${isCorrect ? 'text-emerald-600' : 'text-rose-500'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
          )}
        </div>
      </div>

      <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <Card className="mb-4 p-4 sm:p-6">
          {/* Question Text */}
          <h2 className="text-base sm:text-lg font-semibold leading-relaxed text-slate-900 mb-5 whitespace-pre-wrap">
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
                        inline-block px-3 py-1 mx-1 rounded-lg border-2 text-base font-semibold transition-all outline-none align-middle
                        min-w-[100px] max-w-[180px] text-center
                        ${state.isAnswered 
                            ? (isCorrect 
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-700' 
                                : 'bg-rose-50 border-rose-400 text-rose-700')
                            : 'bg-slate-50 border-slate-200 focus:border-primary-500 focus:bg-white text-slate-900'}
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
            <div className="space-y-2 mb-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected = index === state.selectedAnswer;
                const isCorrectOpt = index === currentQuestion.correctIndex;
                
                let borderColor = 'border-slate-200';
                let bgColor = 'bg-white';
                let textColor = 'text-slate-700';
                let statusIcon = null;

                if (state.isAnswered) {
                  if (isCorrectOpt) {
                    borderColor = 'border-emerald-400';
                    bgColor = 'bg-emerald-50';
                    textColor = 'text-emerald-800';
                    statusIcon = <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />;
                  } else if (isSelected && !isCorrect) {
                    borderColor = 'border-rose-400';
                    bgColor = 'bg-rose-50';
                    textColor = 'text-rose-700';
                    statusIcon = <X size={16} className="text-rose-500 flex-shrink-0" />;
                  } else {
                    bgColor = 'bg-slate-50';
                    textColor = 'text-slate-400';
                    borderColor = 'border-slate-100';
                  }
                } else {
                  borderColor = 'border-slate-200 hover:border-primary-300';
                  bgColor = 'bg-white hover:bg-slate-50';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSubmit(index)}
                    disabled={state.isAnswered}
                    className={`
                      w-full text-left px-3.5 py-3 rounded-xl border-2 font-medium text-sm
                      transition-all flex items-center justify-between gap-3
                      ${borderColor} ${bgColor} ${textColor}
                      ${!state.isAnswered ? 'cursor-pointer active:scale-[0.99]' : ''}
                      ${state.isAnswered && isCorrectOpt ? 'animate-success-glow' : ''}
                      ${state.isAnswered && isSelected && !isCorrect ? 'animate-shake' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`
                        w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0 transition-colors
                        ${state.isAnswered && isCorrectOpt ? 'bg-emerald-500 text-white' : 
                          state.isAnswered && isSelected && !isCorrect ? 'bg-rose-500 text-white' : 
                          'bg-slate-100 text-slate-500'}
                      `}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="leading-snug">{option}</span>
                    </div>
                    {statusIcon}
                  </button>
                );
              })}
            </div>
          )}

          {/* True / False Options */}
          {currentQuestion.type === 'true-false' && (
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
              {[0, 1].map((index) => {
                const label = index === 0 ? 'True' : 'False';
                const isSelected = index === state.selectedAnswer;
                const isCorrectOpt = index === currentQuestion.correctIndex;
                
                let borderColor = 'border-slate-200';
                let bgColor = 'bg-white';
                let textColor = 'text-slate-700';

                if (state.isAnswered) {
                  if (isSelected) {
                    borderColor = isCorrect ? 'border-emerald-400' : 'border-rose-400';
                    bgColor = isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white';
                    textColor = 'text-white';
                  } else if (isCorrectOpt) {
                    borderColor = 'border-emerald-400';
                    bgColor = 'bg-emerald-50';
                    textColor = 'text-emerald-700';
                  } else {
                    bgColor = 'bg-slate-50';
                    textColor = 'text-slate-300';
                    borderColor = 'border-slate-100';
                  }
                } else {
                  borderColor = 'border-slate-200 hover:border-primary-300';
                  bgColor = 'bg-white hover:bg-slate-50';
                  textColor = 'text-slate-700';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSubmit(index)}
                    disabled={state.isAnswered}
                    className={`
                      flex-1 py-3 px-5 rounded-xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2
                      ${borderColor} ${bgColor} ${textColor}
                      ${state.isAnswered && isCorrectOpt ? 'animate-success-glow' : ''}
                      ${state.isAnswered && isSelected && !isCorrect ? 'animate-shake' : ''}
                    `}
                  >
                    {state.isAnswered && isCorrectOpt ? <CheckCircle size={16} /> : 
                     state.isAnswered && isSelected && !isCorrect ? <X size={16} /> : null}
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Fill in the Blank (Standalone) */}
          {currentQuestion.type === 'blank' && !currentQuestion.text.includes('_____') && (
            <div className="mb-6 max-w-md mx-auto">
              <input
                type="text"
                autoFocus
                placeholder="Type your answer..."
                disabled={state.isAnswered}
                className={`
                  w-full px-5 py-3.5 rounded-xl border-2 text-base font-medium transition-all outline-none text-center
                  ${state.isAnswered 
                      ? (isCorrect 
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700' 
                          : 'bg-rose-50 border-rose-400 text-rose-700')
                      : 'bg-white border-slate-200 focus:border-primary-500 text-slate-900'}
                `}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !state.isAnswered && e.currentTarget.value.trim()) {
                    handleAnswerSubmit(e.currentTarget.value.trim());
                  }
                }}
              />
              {!state.isAnswered && (
                <p className="mt-2 text-xs text-slate-400 text-center">Press Enter to submit</p>
              )}
            </div>
          )}

          {/* Correct Answer reveal for failed blanks */}
          {currentQuestion.type === 'blank' && state.isAnswered && !isCorrect && (
            <div className="mt-3 mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 animate-slide-up">
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              <div>
                <div className="text-xs text-emerald-600 font-medium mb-0.5">Correct answer</div>
                <div className="text-base font-semibold text-emerald-700">{currentQuestion.correctAnswer || 'None set'}</div>
              </div>
            </div>
          )}

          {/* Fallback for unknown/legacy types if somehow triggered */}
          {!['multiple-choice', 'true-false', 'blank'].includes(currentQuestion.type) && (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
               <p className="text-sm text-slate-500">This question format is not supported.</p>
            </div>
          )}

          {/* Explanation */}
          {state.isAnswered && currentQuestion.explanation && (
            <div className="animate-fade-in mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-primary-50 border border-primary-100">
                <Lightbulb size={15} className="text-primary-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-700 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors">
            <Flag size={15} />
            <span className="text-xs font-medium">Report</span>
          </button>
          
          <Button 
            onClick={handleNext} 
            disabled={!state.isAnswered}
            className="px-5 h-10 rounded-lg text-sm font-semibold"
          >
            {isLastQuestion ? 'View Summary' : 'Next Question'}
            <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;
