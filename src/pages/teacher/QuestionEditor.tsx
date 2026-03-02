import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, TextArea } from '../../components/ui';
import { useQuiz } from '../../context/QuizContext';

interface FormErrors {
  text?: string;
  options?: string[];
  correctIndex?: string;
  correctAnswer?: string;
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

    if (!text.trim()) newErrors.text = 'Question text is required';

    if (type === 'multiple-choice') {
      options.forEach((option, index) => {
        if (!option.trim()) optionErrors[index] = 'Option cannot be empty';
      });
      if (optionErrors.length > 0) newErrors.options = optionErrors;
      if (correctIndex === null) newErrors.correctIndex = 'Please select the correct answer';
    } else if (type === 'true-false') {
      if (correctIndex === null) newErrors.correctIndex = 'Please select True or False';
    } else if (type === 'blank') {
      if (!correctAnswer.trim()) newErrors.correctAnswer = 'Correct answer is required';
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
      success: isEditing ? 'Question updated!' : 'Question created!',
      error: 'Failed to save question',
    });

    try {
      await promise;
      navigate('/admin');
    } catch (error) {
      console.error(error);
    }
  };

  const addOption = () => { if (options.length < 5) setOptions([...options, '']); };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctIndex !== null) {
        if (correctIndex === index) setCorrectIndex(null);
        else if (correctIndex > index) setCorrectIndex(correctIndex - 1);
      }
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const selectedLecture = lectures.find(l => l.id === lectureId);

  return (
    <div className="animate-fade-in pb-20 sm:pb-0">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold text-slate-900">
            {isEditing ? 'Edit Question' : 'New Question'}
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/admin')}>Cancel</Button>
          <Button type="button" variant="primary" size="sm" onClick={() => handleSubmit()}>
            {isEditing ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-5 sm:p-6 space-y-6">

            {/* Question Text */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Question</label>
              <TextArea
                placeholder="Enter your question..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                error={errors.text}
                rows={3}
                className="text-sm"
              />
            </div>

            {/* Lecture & Section */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Lecture</label>
                <select
                  value={lectureId}
                  onChange={(e) => { setLectureId(e.target.value); setSectionId(''); }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-50 outline-none text-sm text-slate-700 bg-white"
                >
                  <option value="">General</option>
                  {lectures.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Section</label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  disabled={!lectureId}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-50 outline-none text-sm text-slate-700 bg-white disabled:opacity-40 disabled:bg-slate-50"
                >
                  <option value="">All Sections</option>
                  {selectedLecture?.sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Format & Difficulty */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Format</label>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {([
                    { id: 'multiple-choice', label: 'MCQ' },
                    { id: 'true-false', label: 'True/False' },
                    { id: 'blank', label: 'Blank' },
                  ] as const).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setType(f.id);
                        if (f.id === 'true-false') {
                          setOptions(['True', 'False']);
                          if (correctIndex !== null && correctIndex > 1) setCorrectIndex(null);
                        } else if (f.id === 'multiple-choice') {
                          if (options.length === 2 && options[0] === 'True' && options[1] === 'False') setOptions(['', '']);
                          else if (options.length < 2) setOptions(['', '']);
                        }
                      }}
                      className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                        type === f.id
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Difficulty</label>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 rounded-md text-xs font-semibold capitalize transition-all ${
                        difficulty === d
                          ? d === 'easy' ? 'bg-white text-emerald-600 shadow-sm'
                          : d === 'medium' ? 'bg-white text-amber-600 shadow-sm'
                          : 'bg-white text-rose-600 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Answer Area */}
            <div className="border-t border-slate-100 pt-5">
              {/* MCQ Options */}
              {type === 'multiple-choice' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-slate-700">Options</label>
                    {options.length < 5 && (
                      <button type="button" onClick={addOption} className="text-xs font-semibold text-primary-600 flex items-center gap-1 hover:text-primary-700">
                        <Plus size={12} /> Add
                      </button>
                    )}
                  </div>

                  {errors.correctIndex && (
                    <p className="text-xs text-rose-500 mb-2">{errors.correctIndex}</p>
                  )}

                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2 group">
                        <button
                          type="button"
                          onClick={() => setCorrectIndex(index)}
                          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                            correctIndex === index
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500'
                          }`}
                        >
                          {correctIndex === index ? <Check size={14} /> : String.fromCharCode(65 + index)}
                        </button>
                        <input
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
                            errors.options?.[index] ? 'border-rose-300 bg-rose-50' : 'border-slate-200 focus:border-primary-500'
                          }`}
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Click a letter to mark the correct answer</p>
                </div>
              )}

              {/* True/False */}
              {type === 'true-false' && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Correct Answer</label>
                  {errors.correctIndex && <p className="text-xs text-rose-500 mb-2">{errors.correctIndex}</p>}
                  <div className="flex gap-2">
                    {['True', 'False'].map((label, index) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setCorrectIndex(index)}
                        className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                          correctIndex === index
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
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

              {/* Blank */}
              {type === 'blank' && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Correct Answer</label>
                  <input
                    placeholder="Enter the correct answer..."
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                      errors.correctAnswer ? 'border-rose-300' : 'border-slate-200 focus:border-primary-500'
                    }`}
                  />
                  {errors.correctAnswer && <p className="text-xs text-rose-500 mt-1">{errors.correctAnswer}</p>}
                  <p className="text-[11px] text-slate-400 mt-2">
                    Tip: Use <code className="bg-slate-100 px-1 rounded text-slate-500">_____</code> in your question to show the blank inline.
                  </p>
                </div>
              )}
            </div>

            {/* Explanation */}
            <div className="border-t border-slate-100 pt-5">
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Explanation (optional)</label>
              <TextArea
                placeholder="Why is this the correct answer?"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            {/* Visibility */}
            <div className="border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="w-full flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2.5">
                  {isVisible ? <Eye size={16} className="text-emerald-500" /> : <EyeOff size={16} className="text-slate-400" />}
                  <span className={`text-sm font-medium ${isVisible ? 'text-slate-700' : 'text-slate-400'}`}>
                    {isVisible ? 'Visible to students' : 'Hidden from students'}
                  </span>
                </div>
                <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${isVisible ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isVisible ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>

          </div>
        </form>

        {/* Preview */}
        <div className="lg:col-span-2 hidden lg:block">
          <div className="sticky top-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Eye size={14} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Preview</span>
            </div>

            <div className="p-4 min-h-[200px]">
              {text ? (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {type === 'blank' && text.includes('_____') ? (
                      text.split('_____').map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <span className="inline-block px-2 py-0.5 mx-0.5 rounded border border-dashed border-primary-200 bg-primary-50 text-primary-500 text-xs min-w-[50px] text-center">
                              {correctAnswer || '...'}
                            </span>
                          )}
                        </span>
                      ))
                    ) : text}
                  </p>

                  <div className="space-y-1.5">
                    {type === 'multiple-choice' && options.map((option, index) => (
                      option && (
                        <div
                          key={index}
                          className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                            correctIndex === index ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                            correctIndex === index ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          {option}
                        </div>
                      )
                    ))}

                    {type === 'true-false' && (
                      <div className="flex gap-2">
                        {['True', 'False'].map((label, index) => (
                          <div key={label} className={`flex-1 py-2.5 rounded-lg text-center text-xs font-semibold ${
                            correctIndex === index ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {label}
                          </div>
                        ))}
                      </div>
                    )}

                    {type === 'blank' && !text.includes('_____') && (
                      <div className="py-2 px-3 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                        Answer input
                      </div>
                    )}
                  </div>

                  {explanation && (
                    <p className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-100">
                      {explanation}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Eye size={20} className="text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400">Start typing to see preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Actions */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-slate-200 px-4 py-3 z-50">
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/admin')}>Cancel</Button>
          <Button type="button" variant="primary" size="sm" fullWidth onClick={() => handleSubmit()}>
            {isEditing ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;
