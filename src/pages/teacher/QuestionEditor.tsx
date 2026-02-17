import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, Eye, EyeOff, CheckCircle, Gauge } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Card, TextArea } from '../../components/ui';
import { useQuiz } from '../../context/QuizContext';

interface FormErrors {
  text?: string;
  options?: string[];
  correctIndex?: string;
  correctAnswer?: string;
  type?: string;
}

const QuestionEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addQuestion, updateQuestion, getQuestion, lectures } = useQuiz();
  const isEditing = Boolean(id);

  const [text, setText] = useState('');
  const [type, setType] = useState<'multiple-choice' | 'true-false' | 'blank'>('multiple-choice');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [lectureId, setLectureId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (id) {
      const question = getQuestion(id);
      if (question) {
        setText(question.text);
        setType(question.type || 'multiple-choice');
        setDifficulty(question.difficulty || 'medium');
        setOptions(question.options);
        setCorrectIndex(question.correctIndex !== undefined ? question.correctIndex : null);
        setCorrectAnswer(question.correctAnswer || '');
        setExplanation(question.explanation || '');
        setLectureId(question.lectureId || '');
        setSectionId(question.sectionId || '');
        setIsVisible(question.isVisible !== false);
      } else {
        navigate('/admin');
      }
    }
  }, [id, getQuestion, navigate]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const optionErrors: string[] = [];

    if (!text.trim()) {
      newErrors.text = 'Question text is required';
    }

    if (type === 'multiple-choice') {
      options.forEach((option, index) => {
        if (!option.trim()) {
          optionErrors[index] = 'Option cannot be empty';
        }
      });

      if (optionErrors.length > 0) {
        newErrors.options = optionErrors;
      }

      if (correctIndex === null) {
        newErrors.correctIndex = 'Please select the correct answer';
      }
    } else if (type === 'true-false') {
      if (correctIndex === null) {
        newErrors.correctIndex = 'Please select True or False';
      }
    } else if (type === 'blank') {
      if (!correctAnswer.trim()) {
        newErrors.correctAnswer = 'Correct answer is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const promise = (async () => {
      const questionData = {
        text: text.trim(),
        type,
        difficulty,
        options: type === 'blank' ? [] : type === 'true-false' ? ['True', 'False'] : options.map(o => o.trim()),
        correctIndex: type === 'blank' ? undefined : correctIndex!,
        correctAnswer: type === 'blank' ? correctAnswer.trim() : undefined,
        explanation: explanation.trim() || undefined,
        lectureId: lectureId || undefined,
        sectionId: sectionId || undefined,
        isVisible,
      };

      if (isEditing && id) {
        await updateQuestion(id, questionData);
      } else {
        await addQuestion(questionData);
      }
    })();

    toast.promise(promise, {
      loading: isEditing ? 'Updating question...' : 'Creating question...',
      success: isEditing ? 'Question updated successfully' : 'New question added to library',
      error: 'Failed to save question',
    });

    try {
      await promise;
      navigate('/admin');
    } catch (error) {
      console.error(error);
    }
  };

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      // Adjust correctIndex if needed
      if (correctIndex !== null) {
        if (correctIndex === index) {
          setCorrectIndex(null);
        } else if (correctIndex > index) {
          setCorrectIndex(correctIndex - 1);
        }
      }
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="animate-fade-in">
      {/* Header - Compact */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="h-9 w-9 !p-0">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEditing ? 'Edit Question' : 'New Question'}
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
              {isEditing ? 'ID: ' + id?.slice(0, 8) : 'Teacher Resource Library'}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/admin')}>Cancel</Button>
          <Button type="button" variant="primary" size="sm" onClick={handleSubmit} className="shadow-md shadow-primary-200">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5 sm:p-6 shadow-sm border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question Definition Section */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    Question Content
                  </label>
                  <TextArea
                    placeholder="Enter your question text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    error={errors.text}
                    rows={3}
                    className="text-sm py-2"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50/50">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                        Target Lecture
                      </label>
                      <select
                        value={lectureId}
                        onChange={(e) => {
                          setLectureId(e.target.value);
                          setSectionId('');
                        }}
                        className="w-full h-10 px-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-700 bg-white shadow-sm"
                      >
                        <option value="">General (No Lecture)</option>
                        {lectures.map(l => (
                          <option key={l.id} value={l.id}>{l.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                        Select Section
                      </label>
                      <select
                        value={sectionId}
                        onChange={(e) => setSectionId(e.target.value)}
                        disabled={!lectureId}
                        className="w-full h-10 px-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-700 bg-white shadow-sm disabled:opacity-50 disabled:bg-slate-50"
                      >
                        <option value="">Global Assessment</option>
                        {lectures.find(l => l.id === lectureId)?.sections.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                        Select Format
                      </label>
                      <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100 h-10 w-full">
                        {[
                          { id: 'multiple-choice', label: 'MCQ' },
                          { id: 'true-false', label: 'True/False' },
                          { id: 'blank', label: 'Blank' }
                        ].map((t) => {
                          const active = type === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setType(t.id as any);
                                if (t.id === 'true-false') {
                                  setOptions(['True', 'False']);
                                  if (correctIndex !== null && correctIndex > 1) setCorrectIndex(null);
                                } else if (t.id === 'multiple-choice') {
                                  if (options.length === 2 && options[0] === 'True' && options[1] === 'False') {
                                    setOptions(['', '']);
                                  } else if (options.length < 2) {
                                    setOptions(['', '']);
                                  }
                                }
                              }}
                              className={`flex-1 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                                active 
                                  ? 'bg-white text-primary-600 shadow-sm border border-slate-200' 
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-2">
                        <Gauge size={12} />
                        Difficulty Level
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-700 bg-white shadow-sm"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interaction Details Section */}
              <div className="pt-4 border-t border-slate-50 space-y-4">
                {type === 'multiple-choice' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Answer Options
                      </label>
                      {options.length < 5 && (
                        <button 
                          type="button" 
                          onClick={addOption}
                          className="text-[9px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-1 hover:text-primary-700 transition-colors"
                        >
                          <Plus size={10} /> Add Option
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2 group">
                          <button
                            type="button"
                            onClick={() => setCorrectIndex(index)}
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all border-2 font-black text-[10px] ${
                              correctIndex === index
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                                : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200'
                            }`}
                          >
                            {correctIndex === index ? <Check size={14} /> : String.fromCharCode(65 + index)}
                          </button>

                          <div className="flex-1">
                            <input
                              placeholder={`Option ${String.fromCharCode(65 + index)}`}
                              value={option}
                              onChange={(e) => updateOption(index, e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg border-2 text-xs font-bold outline-none transition-all ${
                                errors.options?.[index] ? 'border-rose-200 bg-rose-50' : 'border-slate-50 focus:border-primary-100 bg-slate-50/50'
                              }`}
                            />
                          </div>

                          {options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="opacity-0 group-hover:opacity-100 flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {type === 'true-false' && (
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
                      Confirm Correct Choice
                    </label>
                    <div className="flex gap-2">
                      {['True', 'False'].map((label, index) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setCorrectIndex(index)}
                          className={`flex-1 py-3 rounded-xl border-2 font-black text-xs transition-all flex items-center justify-center gap-2 ${
                            correctIndex === index
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100'
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          {correctIndex === index && <Check size={14} />}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {type === 'blank' && (
                  <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100/50">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2 block">
                      Target Answer
                    </label>
                    <input
                      placeholder="Enter exact correct answer..."
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-amber-100 focus:border-amber-400 outline-none transition-all text-xs font-bold text-amber-900 bg-white shadow-inner"
                    />
                    <div className="mt-3 flex items-start gap-2">
                       <CheckCircle size={12} className="text-amber-500 mt-0.5" />
                       <p className="text-[10px] text-amber-700 font-medium leading-tight">
                         Use <code className="bg-amber-100/50 px-1 rounded">_____</code> in your question text above to insert this answer as an interactive blank.
                       </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Visibility Toggle */}
              <div className="pt-4 border-t border-slate-50">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
                  Student Visibility
                </label>
                <button
                  type="button"
                  onClick={() => setIsVisible(!isVisible)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                    isVisible
                      ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isVisible ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </div>
                    <div className="text-left">
                      <span className={`text-xs font-black block ${
                        isVisible ? 'text-emerald-700' : 'text-slate-500'
                      }`}>
                        {isVisible ? 'Visible to Students' : 'Hidden from Students'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isVisible ? 'Students can see this question in quizzes' : 'This question will not appear in student quizzes'}
                      </span>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
                    isVisible ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      isVisible ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </div>
                </button>
              </div>

              {/* Metadata Section */}
              <div className="pt-4 border-t border-slate-50">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  Supportive Explanation
                </label>
                <TextArea
                  placeholder="Explain the logic behind the answer..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={2}
                  className="text-xs py-2"
                />
              </div>

              {/* Mobile Actions Only */}
              <div className="flex sm:hidden gap-2 pt-4">
                <Button type="submit" fullWidth size="sm">
                   {isEditing ? 'Save' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Preview Column - Sticky */}
        <div className="lg:col-span-5 hidden lg:block">
          <div className="sticky top-6">
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-primary-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Student Preview</span>
                </div>
                {lectureId && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
                    {lectures.find(l => l.id === lectureId)?.title}
                  </span>
                )}
              </div>

              <div className="min-h-[200px] flex flex-col">
                {text ? (
                  <>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 leading-tight whitespace-pre-wrap">
                      {type === 'blank' && text.includes('_____') ? (
                        text.split('_____').map((part, i, arr) => (
                          <span key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <span className="inline-block px-2 py-0.5 mx-1 rounded-lg border-2 border-primary-100 bg-white text-primary-400 min-w-[60px] text-center text-xs align-middle">
                                {correctAnswer || '...'}
                              </span>
                            )}
                          </span>
                        ))
                      ) : text}
                    </h3>
                    
                    <div className="space-y-2 mb-6 flex-1">
                      {type === 'multiple-choice' && options.map((option, index) => (
                        option && (
                          <div
                            key={index}
                            className={`px-3 py-2.5 rounded-xl border-2 flex items-center gap-3 transition-colors ${
                              correctIndex === index
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                                : 'bg-white border-slate-50'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${
                              correctIndex === index ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="text-xs font-bold leading-tight">{option}</span>
                          </div>
                        )
                      ))}

                      {type === 'true-false' && (
                        <div className="flex gap-2">
                          {['True', 'False'].map((label, index) => (
                            <div
                              key={label}
                              className={`flex-1 py-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                                correctIndex === index
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                                  : 'bg-white border-slate-50 text-slate-300'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                correctIndex === index ? 'bg-emerald-500 text-white' : 'bg-slate-100'
                              }`}>
                                {correctIndex === index ? <Check size={14} /> : null}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {type === 'blank' && !text.includes('_____') && (
                        <div className="p-4 rounded-xl border-2 border-primary-50 bg-white text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Interactive Input</p>
                          <div className="h-8 border-2 border-dashed border-slate-100 rounded-lg" />
                        </div>
                      )}
                    </div>

                    {explanation && (
                      <div className="mt-auto pt-4 border-t border-slate-50">
                        <div className="flex items-start gap-2">
                          <CheckCircle size={12} className="text-emerald-500 mt-0.5" />
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                            {explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                      <EyeOff size={20} className="text-slate-200" />
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                      Real-time Preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;
