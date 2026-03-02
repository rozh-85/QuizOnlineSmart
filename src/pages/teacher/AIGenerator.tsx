import { useState, useRef } from 'react';
import { Sparkles, Upload, Save, Trash2, Check, Key, Loader2, X, FileUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, TextArea } from '../../components/ui';
import { useQuiz } from '../../context/QuizContext';
import { Question, QuestionType } from '../../types';
import { generateQuestionsWithAI, testGeminiConnection } from '../../services/aiService';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - pdfjs-dist types might not expect this Vite-specific import
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface GeneratedQuestion extends Omit<Question, 'id'> {
  tempId: string;
}

const AIGenerator = () => {
  const { lectures, addQuestion } = useQuiz();
  const [apiKey, setApiKey] = useState(() => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey) return envKey;
    const saved = localStorage.getItem('edu_ai_api_key');
    if (saved) return saved;
    const providedKey = 'AIzaSyB0nsYVz7HKta-YASJGEkUKCNMjW0_ANyQ';
    localStorage.setItem('edu_ai_api_key', providedKey);
    return providedKey;
  });
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);

  const [selectedLecture, setSelectedLecture] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [questionType, setType] = useState<QuestionType>('multiple-choice');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(5);
  const [language, setLanguage] = useState('English');

  const [sourceType, setSourceType] = useState<'upload' | 'manual'>('manual');
  const [manualText, setManualText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [savingLoading, setSavingLoading] = useState<string | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  const saveApiKey = () => {
    localStorage.setItem('edu_ai_api_key', apiKey);
    setShowKeyInput(false);
    toast.success('API Key saved');
  };

  const handleTestConnection = async () => {
    if (!apiKey) { toast.error('Enter an API Key first'); return; }
    setIsTestLoading(true);
    try {
      const response = await testGeminiConnection(apiKey);
      toast.success(`Connected! ${response.substring(0, 50)}...`, { duration: 4000 });
    } catch (err: any) {
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, useWorkerFetch: false, isEvalSupported: false });
      const pdf = await loadingTask.promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => ('str' in item ? item.str : "")).join(" ");
        fullText += pageText + "\n";
      }
      return fullText;
    } catch (err) {
      console.error("PDF read error:", err);
      return "";
    }
  };

  const extractTextFromFiles = async (): Promise<string> => {
    let combinedText = "";
    for (const file of files) {
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        combinedText += (await extractTextFromPDF(file)) + "\n";
      } else {
        combinedText += (await file.text()) + "\n";
      }
    }
    return combinedText;
  };

  const handleGenerate = async () => {
    if (!apiKey) { toast.error('Please configure your API Key'); setShowKeyInput(true); return; }
    if (!selectedLecture) { toast.error('Please select a lecture'); return; }

    let sourceContent = "";
    if (sourceType === 'manual') {
      if (!manualText.trim()) { toast.error('Please paste lecture content'); return; }
      sourceContent = manualText;
    } else {
      if (files.length === 0) { toast.error('Please upload at least one file'); return; }
      setIsReadingFiles(true);
      try { sourceContent = await extractTextFromFiles(); }
      catch { toast.error('Failed to read files'); setIsReadingFiles(false); return; }
      setIsReadingFiles(false);
    }

    setIsGenerating(true);
    try {
      const lecture = lectures.find(l => l.id === selectedLecture);
      const aiResponse = await generateQuestionsWithAI({
        apiKey, lectureTitle: lecture?.title || "Untitled", sourceContent,
        type: questionType, difficulty, count, language,
      });
      const newQuestions: GeneratedQuestion[] = aiResponse.map((q: any) => ({
        ...q, tempId: Math.random().toString(36).substring(7),
        lectureId: selectedLecture, sectionId: selectedSection || 'AI Generated',
      }));
      setGeneratedQuestions(newQuestions);
      toast.success(`Generated ${newQuestions.length} questions!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveQuestion = async (q: GeneratedQuestion) => {
    setSavingLoading(q.tempId);
    try {
      const { tempId, ...questionData } = q;
      await addQuestion(questionData);
      setGeneratedQuestions(prev => prev.filter(item => item.tempId !== q.tempId));
      toast.success('Saved to library');
    } catch { toast.error('Failed to save'); }
    finally { setSavingLoading(null); }
  };

  const discardQuestion = (tempId: string) => {
    setGeneratedQuestions(prev => prev.filter(q => q.tempId !== tempId));
  };

  const updateGeneratedQuestion = (tempId: string, updates: Partial<GeneratedQuestion>) => {
    setGeneratedQuestions(prev => prev.map(q => q.tempId === tempId ? { ...q, ...updates } : q));
  };

  const selectedLectureObj = lectures.find(l => l.id === selectedLecture);

  return (
    <div className="animate-fade-in pb-20 sm:pb-0">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary-600 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">AI Generator</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTestConnection}
            disabled={isTestLoading || !apiKey}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
          >
            {isTestLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Test Connection
          </button>
          {showKeyInput ? (
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Gemini API Key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-primary-500 w-40"
              />
              <Button size="sm" onClick={saveApiKey}>Save</Button>
            </div>
          ) : (
            <button
              onClick={() => setShowKeyInput(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 transition-colors"
            >
              <Key size={12} />
              API Key
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* Form */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-5 sm:p-6 space-y-6">

            {/* Source */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Content Source</label>
              <div className="flex bg-slate-100 rounded-lg p-1 mb-3">
                <button
                  onClick={() => setSourceType('manual')}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                    sourceType === 'manual' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Paste Text
                </button>
                <button
                  onClick={() => setSourceType('upload')}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                    sourceType === 'upload' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Upload PDF
                </button>
              </div>

              {sourceType === 'manual' ? (
                <TextArea
                  placeholder="Paste your lecture notes here..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  rows={5}
                  className="text-sm"
                />
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all"
                >
                  <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.txt" onChange={handleFileChange} />
                  <FileUp size={20} className="text-slate-400" />
                  <p className="text-xs font-medium text-slate-500">Click to upload PDF or TXT</p>
                  {files.length > 0 && (
                    <div className="w-full mt-2 space-y-1">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg text-xs">
                          <span className="truncate text-slate-600 font-medium">{f.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-slate-400 hover:text-rose-500">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lecture & Section */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Lecture</label>
                <select
                  value={selectedLecture}
                  onChange={(e) => { setSelectedLecture(e.target.value); setSelectedSection(''); }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-50 outline-none text-sm text-slate-700 bg-white"
                >
                  <option value="">Select a lecture...</option>
                  {lectures.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  disabled={!selectedLecture}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-50 outline-none text-sm text-slate-700 bg-white disabled:opacity-40 disabled:bg-slate-50"
                >
                  <option value="">All Sections</option>
                  {(selectedLectureObj?.sections ?? []).map(s => <option key={s} value={s}>{s}</option>)}
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
                      onClick={() => setType(f.id)}
                      className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                        questionType === f.id ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
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

            {/* Count & Language */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Quantity</label>
                <input
                  type="number" min="1" max="15" value={count}
                  onChange={e => setCount(parseInt(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-50 outline-none text-sm text-slate-700 bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Language</label>
                <input
                  type="text" value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-50 outline-none text-sm text-slate-700 bg-white"
                />
              </div>
            </div>

            {/* Generate Button */}
            <div className="border-t border-slate-100 pt-5">
              <Button
                fullWidth
                onClick={handleGenerate}
                disabled={isGenerating || isReadingFiles}
              >
                {isGenerating || isReadingFiles ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Sparkles size={16} />
                )}
                {isReadingFiles ? 'Reading files...' : isGenerating ? 'Generating...' : 'Generate Questions'}
              </Button>
            </div>

          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Generated
              {generatedQuestions.length > 0 && (
                <span className="ml-1.5 text-xs font-medium text-slate-400">({generatedQuestions.length})</span>
              )}
            </h2>
            {generatedQuestions.length > 0 && (
              <button onClick={() => setGeneratedQuestions([])} className="text-xs font-medium text-slate-400 hover:text-rose-500 transition-colors">
                Discard all
              </button>
            )}
          </div>

          {generatedQuestions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
              <Sparkles size={24} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-400">No questions yet</p>
              <p className="text-xs text-slate-300 mt-1">Fill in the form and click Generate</p>
            </div>
          ) : (
            <div className="space-y-3">
              {generatedQuestions.map((q, idx) => (
                <div key={q.tempId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                          {q.type === 'multiple-choice' ? 'MCQ' : q.type === 'true-false' ? 'T/F' : 'Blank'}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' :
                          q.difficulty === 'hard' ? 'bg-rose-50 text-rose-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>{q.difficulty}</span>
                      </div>
                      <button onClick={() => discardQuestion(q.tempId)} className="text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Question text */}
                    <textarea
                      value={q.text}
                      onChange={e => updateGeneratedQuestion(q.tempId, { text: e.target.value })}
                      className="w-full text-sm font-medium text-slate-800 bg-transparent border-none outline-none resize-none mb-3"
                      rows={2}
                    />

                    {/* Options */}
                    <div className="space-y-1.5 mb-3">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                          oIdx === q.correctIndex ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
                        }`}>
                          <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                            oIdx === q.correctIndex ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <input
                            value={opt}
                            onChange={e => {
                              const next = [...q.options];
                              next[oIdx] = e.target.value;
                              updateGeneratedQuestion(q.tempId, { options: next });
                            }}
                            className="flex-1 bg-transparent border-none outline-none font-medium"
                          />
                        </div>
                      ))}
                      {q.type === 'blank' && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs">
                          <Check size={12} />
                          <input
                            value={q.correctAnswer}
                            onChange={e => updateGeneratedQuestion(q.tempId, { correctAnswer: e.target.value })}
                            className="flex-1 bg-transparent border-none outline-none font-semibold"
                            placeholder="Correct answer"
                          />
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 italic border-t border-slate-100 pt-2">{q.explanation}</p>
                    )}
                  </div>

                  {/* Save bar */}
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <Button size="sm" onClick={() => saveQuestion(q)} disabled={savingLoading === q.tempId}>
                      {savingLoading === q.tempId ? <Loader2 className="animate-spin" size={12} /> : <><Save size={12} /> Save</>}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIGenerator;

