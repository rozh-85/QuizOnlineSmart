import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Check, Eye, EyeOff, CheckCircle,
  Type, BookOpen, ListChecks, Lightbulb, GripVertical,
  Sparkles, CircleDot, ToggleLeft, PenLine, Zap, Shield, ShieldOff,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, TextArea } from '../../components/ui';
import { useQuiz } from '../../context/QuizContext';

interface FormErrors {
  text?: string;
  options?: string[];
  correctIndex?: string;
  correctAnswer?: string;
  type?: string;
}

/* ─── Difficulty config ─── */
const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200',     dot: 'bg-amber-500' },
  hard:   { label: 'Hard',   color: 'bg-rose-100 text-rose-700 border-rose-200',         dot: 'bg-rose-500' },
} as const;

/* ─── Format config ─── */
const FORMAT_CONFIG = [
  { id: 'multiple-choice' as const, label: 'Multiple Choice', icon: CircleDot,   desc: 'A-B-C-D options' },
  { id: 'true-false' as const,      label: 'True / False',    icon: ToggleLeft,  desc: 'Binary answer' },
  { id: 'blank' as const,           label: 'Fill in Blank',   icon: PenLine,     desc: 'Type the answer' },
];

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

  /* ─── Completion progress ─── */
  const completionSteps = useMemo(() => {
    const steps = [
      { label: 'Question text', done: text.trim().length > 0 },
      { label: 'Question format', done: true },
      { label: 'Correct answer', done:
          type === 'blank'
            ? correctAnswer.trim().length > 0
            : correctIndex !== null
      },
    ];
    if (type === 'multiple-choice') {
      steps.push({ label: 'Answer options', done: options.filter(o => o.trim()).length >= 2 });
    }
    return steps;
  }, [text, type, correctIndex, correctAnswer, options]);

  const completionPct = Math.round((completionSteps.filter(s => s.done).length / completionSteps.length) * 100);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
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

  /* ─── Section header helper ─── */
  const SectionHeader = ({ step, icon: Icon, title, subtitle }: {
    step: number; icon: typeof Type; title: string; subtitle: string;
  }) => (
    <div className="flex items-center gap-3 mb-5">
      <div className="relative">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-md shadow-primary-100">
          <Icon size={16} className="text-white" />
        </div>
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border-2 border-primary-500 text-primary-600 text-[9px] font-black flex items-center justify-center shadow-sm">
          {step}
        </span>
      </div>
      <div>
        <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>
        <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in pb-24 sm:pb-0">
      {/* ─── Header ─── */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="h-10 w-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isEditing ? 'Edit Question' : 'New Question'}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {isEditing ? <>Editing <span className="font-mono text-slate-500">{id?.slice(0, 8)}</span></> : 'Add a new question to your library'}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleSubmit()}
            className="shadow-lg shadow-primary-100 !font-bold"
          >
            <Sparkles size={14} />
            {isEditing ? 'Save Changes' : 'Create Question'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* ═══ LEFT: Form Column ═══ */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── Section 1: Question Content ── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
              <SectionHeader step={1} icon={Type} title="Question Content" subtitle="Write your question clearly" />
              <TextArea
                placeholder="e.g. What is the primary function of the mitochondria in a cell?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                error={errors.text}
                rows={3}
                className="text-sm !rounded-xl !border-slate-200 focus:!border-primary-500"
              />
              <div className="flex items-center justify-between mt-3">
                <span className={`text-[11px] font-medium ${text.trim().length > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>
                  {text.trim().length > 0 ? `${text.trim().length} characters` : 'Start typing...'}
                </span>
                {errors.text && (
                  <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                    <AlertCircle size={11} /> Required
                  </span>
                )}
              </div>
            </div>

            {/* ── Section 2: Classification ── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
              <SectionHeader step={2} icon={BookOpen} title="Classification" subtitle="Organize and categorize this question" />

              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Lecture</label>
                  <select
                    value={lectureId}
                    onChange={(e) => {
                      setLectureId(e.target.value);
                      setSectionId('');
                    }}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 outline-none transition-all text-sm font-semibold text-slate-700 bg-white cursor-pointer appearance-none"
                  >
                    <option value="">General (No Lecture)</option>
                    {lectures.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Section</label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    disabled={!lectureId}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 outline-none transition-all text-sm font-semibold text-slate-700 bg-white cursor-pointer appearance-none disabled:opacity-40 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    <option value="">All Sections</option>
                    {lectures.find(l => l.id === lectureId)?.sections.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block">Difficulty</label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((d) => {
                    const cfg = DIFFICULTY_CONFIG[d];
                    const active = difficulty === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          active
                            ? `${cfg.color} border-current shadow-sm`
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-500'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${active ? cfg.dot : 'bg-slate-300'}`} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Section 3: Answer Format ── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
              <SectionHeader step={3} icon={ListChecks} title="Answer Format" subtitle="Choose how students will respond" />

              {/* Format selector cards */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {FORMAT_CONFIG.map((f) => {
                  const active = type === f.id;
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setType(f.id);
                        if (f.id === 'true-false') {
                          setOptions(['True', 'False']);
                          if (correctIndex !== null && correctIndex > 1) setCorrectIndex(null);
                        } else if (f.id === 'multiple-choice') {
                          if (options.length === 2 && options[0] === 'True' && options[1] === 'False') {
                            setOptions(['', '']);
                          } else if (options.length < 2) {
                            setOptions(['', '']);
                          }
                        }
                      }}
                      className={`relative py-3.5 px-2 rounded-xl border-2 transition-all text-center group ${
                        active
                          ? 'border-primary-500 bg-primary-50/60 shadow-md shadow-primary-100'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
                      }`}
                    >
                      {active && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </span>
                      )}
                      <Icon size={20} className={`mx-auto mb-1.5 ${active ? 'text-primary-600' : 'text-slate-300 group-hover:text-slate-400'}`} />
                      <div className={`text-[11px] font-bold ${active ? 'text-primary-700' : 'text-slate-500'}`}>{f.label}</div>
                      <div className={`text-[9px] font-medium mt-0.5 ${active ? 'text-primary-500' : 'text-slate-300'}`}>{f.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* MCQ Options */}
              {type === 'multiple-choice' && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-600">
                      Answer Options
                      <span className="ml-1.5 text-slate-400 font-medium">({options.length}/5)</span>
                    </label>
                    {options.length < 5 && (
                      <button 
                        type="button" 
                        onClick={addOption}
                        className="text-xs font-bold text-primary-600 flex items-center gap-1 hover:text-primary-700 transition-colors px-2.5 py-1 rounded-lg hover:bg-primary-50"
                      >
                        <Plus size={12} /> Add
                      </button>
                    )}
                  </div>

                  {errors.correctIndex && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 flex items-center gap-2">
                      <AlertCircle size={13} className="text-rose-500 flex-shrink-0" />
                      <span className="text-xs text-rose-600 font-semibold">{errors.correctIndex}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {options.map((option, index) => {
                      const isCorrect = correctIndex === index;
                      const hasError = errors.options?.[index];
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border-2 transition-all group ${
                            isCorrect
                              ? 'border-emerald-300 bg-emerald-50/50'
                              : hasError
                                ? 'border-rose-200 bg-rose-50/30'
                                : 'border-slate-100 bg-slate-50/30 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex-shrink-0 text-slate-200 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical size={14} />
                          </div>

                          <button
                            type="button"
                            onClick={() => setCorrectIndex(index)}
                            title="Mark as correct answer"
                            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2 font-bold text-xs ${
                              isCorrect
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500'
                            }`}
                          >
                            {isCorrect ? <Check size={16} strokeWidth={3} /> : String.fromCharCode(65 + index)}
                          </button>

                          <input
                            placeholder={`Option ${String.fromCharCode(65 + index)}...`}
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium outline-none bg-transparent text-slate-700 placeholder:text-slate-300"
                          />

                          {isCorrect && (
                            <span className="hidden sm:inline-flex text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
                              Correct
                            </span>
                          )}

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
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-3 font-medium">
                    Click the letter badge to mark the correct answer
                  </p>
                </div>
              )}

              {/* True/False */}
              {type === 'true-false' && (
                <div className="animate-fade-in">
                  <label className="text-xs font-bold text-slate-600 mb-3 block">Select the correct answer</label>
                  {errors.correctIndex && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 flex items-center gap-2">
                      <AlertCircle size={13} className="text-rose-500 flex-shrink-0" />
                      <span className="text-xs text-rose-600 font-semibold">{errors.correctIndex}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {['True', 'False'].map((label, index) => {
                      const active = correctIndex === index;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setCorrectIndex(index)}
                          className={`relative py-5 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 ${
                            active
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-md shadow-emerald-100'
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-500'
                          }`}
                        >
                          {active && (
                            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check size={12} className="text-white" />
                            </span>
                          )}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            active ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'
                          }`}>
                            {label === 'True' ? <Check size={18} /> : <span className="text-lg font-black">&times;</span>}
                          </div>
                          <span className="font-extrabold">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fill in Blank */}
              {type === 'blank' && (
                <div className="animate-fade-in">
                  <label className="text-xs font-bold text-slate-600 mb-2 block">Correct Answer</label>
                  <input
                    placeholder="Type the exact correct answer..."
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-sm font-semibold bg-white ${
                      errors.correctAnswer
                        ? 'border-rose-300 text-rose-700 focus:ring-4 focus:ring-rose-50'
                        : 'border-amber-200 text-amber-900 focus:border-amber-400 focus:ring-4 focus:ring-amber-50'
                    }`}
                  />
                  {errors.correctAnswer && (
                    <p className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.correctAnswer}
                    </p>
                  )}
                  <div className="mt-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="flex items-start gap-2">
                      <Zap size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                        Use <code className="bg-amber-100 px-1.5 py-0.5 rounded font-bold text-amber-800">_____</code> in
                        your question text to create an inline blank that students fill in.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Section 4: Settings ── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
              <SectionHeader step={4} icon={Lightbulb} title="Extra Settings" subtitle="Visibility, hints, and explanation" />

              {/* Visibility */}
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all mb-5 ${
                  isVisible
                    ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
                    : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isVisible ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {isVisible ? <Shield size={16} /> : <ShieldOff size={16} />}
                  </div>
                  <div className="text-left">
                    <span className={`text-sm font-bold block leading-tight ${
                      isVisible ? 'text-emerald-700' : 'text-slate-500'
                    }`}>
                      {isVisible ? 'Visible to Students' : 'Hidden from Students'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium leading-tight">
                      {isVisible ? 'This question will appear in student quizzes' : 'Only visible to teachers'}
                    </span>
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full p-0.5 transition-all ${
                  isVisible ? 'bg-emerald-500' : 'bg-slate-200'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    isVisible ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </button>

              {/* Explanation */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Explanation (Optional)</label>
                <TextArea
                  placeholder="Help students understand why this is the correct answer..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={2}
                  className="text-sm !rounded-xl !border-slate-200 focus:!border-primary-500"
                />
              </div>
            </div>

          </form>
        </div>

        {/* ═══ RIGHT: Preview + Progress ═══ */}
        <div className="lg:col-span-5 xl:col-span-4 hidden lg:block">
          <div className="sticky top-6 space-y-4">

            {/* Completion Progress */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-600">Completion</h4>
                <span className={`text-xs font-black ${completionPct === 100 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {completionPct}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completionPct === 100 ? 'bg-emerald-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <div className="space-y-1.5">
                {completionSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.done ? 'bg-emerald-500' : 'bg-slate-100'
                    }`}>
                      {step.done && <Check size={10} className="text-white" />}
                    </div>
                    <span className={`text-[11px] font-medium ${step.done ? 'text-slate-600 line-through' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Preview header */}
              <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-primary-600" />
                  <span className="text-[11px] font-bold text-slate-500">Live Preview</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Type badge */}
                  <span className="text-[9px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {FORMAT_CONFIG.find(f => f.id === type)?.label}
                  </span>
                  {/* Difficulty badge */}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_CONFIG[difficulty].color}`}>
                    {difficulty}
                  </span>
                </div>
              </div>

              <div className="p-5 min-h-[220px] flex flex-col">
                {text ? (
                  <>
                    {/* Lecture tag */}
                    {lectureId && (
                      <span className="self-start text-[10px] font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg mb-3">
                        {lectures.find(l => l.id === lectureId)?.title}
                        {sectionId && <span className="text-primary-400"> / {sectionId}</span>}
                      </span>
                    )}

                    <h3 className="text-base font-bold text-slate-800 leading-relaxed mb-5 whitespace-pre-wrap">
                      {type === 'blank' && text.includes('_____') ? (
                        text.split('_____').map((part, i, arr) => (
                          <span key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <span className="inline-block px-3 py-0.5 mx-1 rounded-lg border-2 border-dashed border-primary-200 bg-primary-50/50 text-primary-500 min-w-[70px] text-center text-xs font-bold align-middle">
                                {correctAnswer || '___'}
                              </span>
                            )}
                          </span>
                        ))
                      ) : text}
                    </h3>
                    
                    <div className="space-y-2 mb-4 flex-1">
                      {type === 'multiple-choice' && options.map((option, index) => (
                        option && (
                          <div
                            key={index}
                            className={`px-3.5 py-2.5 rounded-xl border-2 flex items-center gap-3 transition-all ${
                              correctIndex === index
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-white border-slate-100 text-slate-600'
                            }`}
                          >
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                              correctIndex === index ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {correctIndex === index ? <Check size={12} /> : String.fromCharCode(65 + index)}
                            </span>
                            <span className="text-xs font-semibold leading-tight">{option}</span>
                          </div>
                        )
                      ))}

                      {type === 'true-false' && (
                        <div className="flex gap-2">
                          {['True', 'False'].map((label, index) => (
                            <div
                              key={label}
                              className={`flex-1 py-4 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                                correctIndex === index
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                  : 'bg-white border-slate-100 text-slate-300'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                correctIndex === index ? 'bg-emerald-500 text-white' : 'bg-slate-100'
                              }`}>
                                {correctIndex === index ? <Check size={14} /> : null}
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {type === 'blank' && !text.includes('_____') && (
                        <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center">
                          <p className="text-xs text-slate-400 font-medium">Student answer input appears here</p>
                        </div>
                      )}
                    </div>

                    {explanation && (
                      <div className="mt-auto pt-3 border-t border-slate-100">
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50/50">
                          <CheckCircle size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                            {explanation}
                          </p>
                        </div>
                      </div>
                    )}

                    {!isVisible && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
                        <EyeOff size={12} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-600">Hidden from students</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center mb-3">
                      <Eye size={22} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 mb-1">Live Preview</p>
                    <p className="text-[11px] text-slate-300 font-medium max-w-[180px]">
                      Start typing your question to see a real-time preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Sticky Action Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white/90 backdrop-blur-xl border-t border-slate-200 px-4 py-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="flex-shrink-0"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => handleSubmit()}
            className="shadow-md shadow-primary-100 !font-bold"
          >
            <Sparkles size={14} />
            {isEditing ? 'Save Changes' : 'Create Question'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;
