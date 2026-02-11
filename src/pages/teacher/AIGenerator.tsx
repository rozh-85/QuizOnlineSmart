import { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Cpu, 
  Save, 
  Trash2, 
  CheckCircle, 
  Key, 
  Loader2, 
  BrainCircuit,
  Clipboard,
  X,
  FileUp,
  ChevronDown,
  Layout
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Card, TextArea, Input } from '../../components/ui';
import { useQuiz } from '../../context/QuizContext';
import { Question, QuestionType } from '../../types';
import { generateQuestionsWithAI, testGeminiConnection } from '../../services/aiService';
import * as pdfjsLib from 'pdfjs-dist';
// Import the worker using Vite's native worker loader
// @ts-ignore - pdfjs-dist types might not expect this Vite-specific import
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';

// Configure PDF.js worker with VPC-safe internal bundle
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface GeneratedQuestion extends Omit<Question, 'id'> {
  tempId: string;
}

const AIGenerator = () => {
  const { lectures, addQuestion } = useQuiz();
  const [apiKey, setApiKey] = useState(() => {
    // Priority: .env.local -> localStorage -> Default provided key
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey) return envKey;
    
    const saved = localStorage.getItem('edu_ai_api_key');
    if (saved) return saved;
    
    const providedKey = 'AIzaSyB0nsYVz7HKta-YASJGEkUKCNMjW0_ANyQ';
    localStorage.setItem('edu_ai_api_key', providedKey);
    return providedKey;
  });
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);
  
  // Generation Params
  const [selectedLecture, setSelectedLecture] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [questionType, setType] = useState<QuestionType>('multiple-choice');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(5);
  const [language, setLanguage] = useState('English');
  
  // Content Source
  const [sourceType, setSourceType] = useState<'upload' | 'manual'>('manual');
  const [manualText, setManualText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [savingLoading, setSavingLoading] = useState<string | null>(null);
  const [isConfigExpanded, setIsConfigExpanded] = useState(true);
  const [isTestLoading, setIsTestLoading] = useState(false);

  const saveApiKey = () => {
    localStorage.setItem('edu_ai_api_key', apiKey);
    setShowKeyInput(false);
    toast.success('API Key saved locally');
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast.error('Please enter an API Key first');
      return;
    }
    setIsTestLoading(true);
    try {
      const response = await testGeminiConnection(apiKey);
      toast.success(`Gemini Connection Success! Response: ${response.substring(0, 50)}...`, {
        duration: 5000,
        icon: '🚀'
      });
    } catch (err: any) {
      toast.error(`Test Failed: ${err.message}`);
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false, // Ensure we use the worker we just imported
        isEvalSupported: false 
      });
      const pdf = await loadingTask.promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => {
            if ('str' in item) return item.str;
            return "";
          })
          .join(" ");
        fullText += pageText + "\n";
      }
      
      return fullText;
    } catch (err) {
      console.error("Critical PDF System Failure:", err);
      // Fallback for extremely strict environments
      return ""; 
    }
  };

  const extractTextFromFiles = async (): Promise<string> => {
    let combinedText = "";
    for (const file of files) {
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const text = await extractTextFromPDF(file);
        combinedText += text + "\n";
      } else {
        const text = await file.text();
        combinedText += text + "\n";
      }
    }
    return combinedText;
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      toast.error('Please configure your Gemini API Key first');
      setShowKeyInput(true);
      return;
    }
    if (!selectedLecture) {
      toast.error('Please select a lecture first');
      return;
    }
    
    let sourceContent = "";
    if (sourceType === 'manual') {
      if (!manualText.trim()) {
        toast.error('Please paste lecture content');
        return;
      }
      sourceContent = manualText;
    } else {
      if (files.length === 0) {
        toast.error('Please upload at least one file');
        return;
      }
      setIsReadingFiles(true);
      try {
        sourceContent = await extractTextFromFiles();
      } catch (err) {
        console.error("File Reading Error:", err);
        toast.error('Failed to read files. Please try a different PDF or copy-paste text instead.');
        setIsReadingFiles(false);
        return;
      }
      setIsReadingFiles(false);
    }

    setIsGenerating(true);
    
    try {
      const lecture = lectures.find(l => l.id === selectedLecture);
      const aiResponse = await generateQuestionsWithAI({
        apiKey,
        lectureTitle: lecture?.title || "Untitled Lecture",
        sourceContent,
        type: questionType,
        difficulty,
        count,
        language
      });

      const newQuestions: GeneratedQuestion[] = aiResponse.map((q: any) => ({
        ...q,
        tempId: Math.random().toString(36).substring(7),
        lectureId: selectedLecture,
        sectionId: selectedSection || 'AI Generated'
      }));

      setGeneratedQuestions(newQuestions);
      setIsConfigExpanded(false); // Collapse config to show results
      toast.success(`Successfully generated ${newQuestions.length} questions!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate questions. Please check your API key.');
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
      toast.success('Question saved to library');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save question');
    } finally {
      setSavingLoading(null);
    }
  };

  const discardQuestion = (tempId: string) => {
    setGeneratedQuestions(prev => prev.filter(q => q.tempId !== tempId));
  };

  const updateGeneratedQuestion = (tempId: string, updates: Partial<GeneratedQuestion>) => {
    setGeneratedQuestions(prev => prev.map(q => q.tempId === tempId ? { ...q, ...updates } : q));
  };

  return (
    <div className="animate-fade-in space-y-4 w-full">
      {/* Top Header & Settings */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Sparkles className="text-primary-600" size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight">AI Generator.</h2>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Real-time Gemini Intelligence</p>
            </div>
          </div>
        </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTestLoading || !apiKey}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black text-primary-600 bg-primary-50 hover:bg-primary-100 transition-all border border-primary-200 disabled:opacity-50"
            >
              {isTestLoading ? <Loader2 size={12} className="animate-spin" /> : <BrainCircuit size={12} />}
              Test Gemini
            </button>

            {showKeyInput ? (
              <div className="flex gap-2">
                <Input 
                  type="password" 
                  placeholder="Enter Gemini API Key..." 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="h-9 py-0 text-[10px] w-48"
                />
                <Button size="sm" onClick={saveApiKey} className="h-9">Save</Button>
              </div>
            ) : (
              <button 
                onClick={() => setShowKeyInput(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all border border-slate-100"
              >
                <Key size={12} />
                API Key Configured
              </button>
            )}
          </div>
      </div>

      {/* Main Configuration Card - Compact & viewport fitting */}
      <Card className="p-0 overflow-hidden border-slate-200 shadow-lg">
        <button 
          onClick={() => setIsConfigExpanded(!isConfigExpanded)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 hover:bg-slate-100/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Layout size={18} className="text-primary-500" />
            <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">AI Agent Configuration</h3>
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isConfigExpanded ? 'rotate-180' : ''}`} />
        </button>

        {isConfigExpanded && (
          <div className="p-6 grid lg:grid-cols-2 gap-8 divide-x divide-slate-100">
            {/* Column 1: Source Selection */}
            <div className="space-y-6 pr-4">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-3 block">1. Material Source</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setSourceType('manual')}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${
                        sourceType === 'manual' 
                          ? 'bg-primary-50 border-primary-500 text-primary-600 shadow-sm' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <Clipboard size={14} />
                      PASTE TEXT
                    </button>
                    <button
                      onClick={() => setSourceType('upload')}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${
                        sourceType === 'upload' 
                          ? 'bg-primary-50 border-primary-500 text-primary-600 shadow-sm' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <Upload size={14} />
                      UPLOAD PDF
                    </button>
                  </div>

                  {sourceType === 'manual' ? (
                    <TextArea
                      placeholder="Paste your lecture notes or transcript here..."
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      rows={6}
                      className="text-xs bg-slate-50 border-slate-100 focus:bg-white transition-all ring-primary-50"
                    />
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all"
                    >
                      <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.txt" onChange={handleFileChange} />
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                        <FileUp className="text-slate-400" size={20} />
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-black text-slate-700">Drop files or click</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">PDF or TXT supported</p>
                      </div>
                      {files.length > 0 && (
                        <div className="w-full mt-3 space-y-2">
                           {files.map((f, i) => (
                             <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 text-[10px] font-bold">
                               <span className="truncate max-w-[120px]">{f.name}</span>
                               <X size={12} className="text-slate-400 hover:text-rose-500" onClick={(e) => { e.stopPropagation(); removeFile(i); }} />
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                  )}
               </div>

               <div className="space-y-4">
                 <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-3 block">2. Target Destination</label>
                   <div className="space-y-3">
                     <div>
                       <span className="text-[9px] font-bold text-slate-400 mb-1.5 block">SELECT LECTURE</span>
                       <select
                          value={selectedLecture}
                          onChange={(e) => {
                            setSelectedLecture(e.target.value);
                            setSelectedSection('');
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-700 bg-white"
                        >
                          <option value="">Select a lecture...</option>
                          {lectures.map(l => (
                            <option key={l.id} value={l.id}>{l.title}</option>
                          ))}
                        </select>
                     </div>

                     {selectedLecture && (
                       <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                         <span className="text-[9px] font-bold text-slate-400 mb-1.5 block">SELECT SECTION</span>
                         <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 focus:border-primary-500 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-700 bg-white"
                          >
                            <option value="">Select a section...</option>
                            {(lectures.find(l => l.id === selectedLecture)?.sections ?? []).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
            </div>

            {/* Column 2: Parameters */}
            <div className="space-y-6 pl-8">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-3 block">3. Agent Parameters</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 mb-1.5 block">FORMAT</span>
                      <select value={questionType} onChange={e => setType(e.target.value as any)} className="w-full p-2 border-2 border-slate-100 rounded-lg text-[10px] font-black uppercase bg-white">
                        <option value="multiple-choice">MCQ</option>
                        <option value="true-false">True/False</option>
                        <option value="blank">Blank</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 mb-1.5 block">DIFFICULTY</span>
                      <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="w-full p-2 border-2 border-slate-100 rounded-lg text-[10px] font-black uppercase bg-white">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 mb-1.5 block">QUANTITY</span>
                      <input type="number" min="1" max="15" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full p-2 border-2 border-slate-100 rounded-lg text-[10px] font-black bg-white" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 mb-1.5 block">LANGUAGE</span>
                      <input type="text" value={language} onChange={e => setLanguage(e.target.value)} className="w-full p-2 border-2 border-slate-100 rounded-lg text-[10px] font-black bg-white" />
                    </div>
                  </div>
               </div>

               <div className="pt-4 border-t border-slate-50">
                  <Button 
                    fullWidth 
                    size="lg" 
                    onClick={handleGenerate} 
                    disabled={isGenerating || isReadingFiles}
                    className="h-14 shadow-xl shadow-primary-100 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 transition-all group-hover:scale-105" />
                    <div className="relative flex items-center justify-center gap-3">
                      {isGenerating || isReadingFiles ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <BrainCircuit size={20} />
                      )}
                      <span className="font-black uppercase tracking-widest text-xs">
                        {isReadingFiles ? 'READING PDF...' : isGenerating ? 'GENERATING...' : 'INITIATE ENGINE'}
                      </span>
                    </div>
                  </Button>
               </div>
            </div>
          </div>
        )}
      </Card>

      {/* Generated Assets Section - Full width below */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
             <CheckCircle size={14} className="text-emerald-500" />
             Generated Assets Library
             {generatedQuestions.length > 0 && (
               <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-black text-[9px] ml-1">
                 {generatedQuestions.length} READY
               </span>
             )}
           </h3>
           {generatedQuestions.length > 0 && (
             <button onClick={() => setGeneratedQuestions([])} className="text-xs font-black text-slate-400 hover:text-rose-600 uppercase tracking-widest transition-colors">
               Discard All
             </button>
           )}
        </div>

        {generatedQuestions.length === 0 ? (
          <div className="py-20 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center bg-white/40">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
              <Cpu size={32} className="text-slate-200" />
            </div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">System Awaiting Initiation</h4>
            <p className="text-slate-400 text-[10px] font-bold max-w-xs uppercase tracking-tight">Configure material sources above to populate this library.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 pb-24">
            {generatedQuestions.map((q, idx) => (
              <Card key={q.tempId} className="p-0 overflow-hidden border-slate-200 hover:border-primary-300 transition-all shadow-sm flex flex-col bg-white">
                <div className="p-3 flex-1">
                   <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-slate-400 font-black text-[10px] border border-slate-200">
                          {idx + 1}
                        </div>
                        <div className="flex items-center gap-1.5">
                           <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest">{q.type}</span>
                           <span className={`text-[8px] font-black uppercase px-1.5 rounded-full border ${
                             q.difficulty === 'easy' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                             q.difficulty === 'hard' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                             'bg-amber-50 border-amber-100 text-amber-600'
                           }`}>{q.difficulty}</span>
                        </div>
                      </div>
                      <button onClick={() => discardQuestion(q.tempId)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={12} /></button>
                   </div>
                   
                   <TextArea
                     value={q.text}
                     onChange={e => updateGeneratedQuestion(q.tempId, { text: e.target.value })}
                     className="text-[12px] font-bold bg-transparent border-transparent focus:bg-slate-50 transition-all mb-2 px-0 min-h-0"
                     rows={2}
                   />

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`px-2 py-1.5 rounded-lg border flex items-center gap-2 transition-all ${oIdx === q.correctIndex ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                           <div className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-black ${oIdx === q.correctIndex ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                             {String.fromCharCode(64 + (oIdx + 1))}
                           </div>
                           <input 
                             value={opt} 
                             onChange={e => {
                               const next = [...q.options];
                               next[oIdx] = e.target.value;
                               updateGeneratedQuestion(q.tempId, { options: next });
                             }}
                             className="text-[10px] font-bold bg-transparent border-none outline-none w-full"
                           />
                        </div>
                      ))}
                      {q.type === 'blank' && (
                        <div className="col-span-2 px-2 py-1.5 rounded-xl border bg-emerald-50 border-emerald-100 flex items-center gap-2">
                           <CheckCircle size={12} className="text-emerald-500" />
                           <input value={q.correctAnswer} onChange={e => updateGeneratedQuestion(q.tempId, { correctAnswer: e.target.value })} className="text-[10px] font-black bg-transparent border-none outline-none w-full" placeholder="Correct Answer" />
                        </div>
                      )}
                   </div>

                   <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-[9px] font-bold text-slate-900 uppercase tracking-widest mb-1">Logic Rationale</p>
                      <TextArea
                        value={q.explanation}
                        onChange={e => updateGeneratedQuestion(q.tempId, { explanation: e.target.value })}
                        className="text-[10px] leading-snug font-medium text-slate-500 bg-transparent border-transparent p-0 min-h-0"
                        rows={2}
                      />
                   </div>
                </div>

                <div className="bg-white px-3 py-2 border-t border-slate-200 flex items-center justify-between">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">System Ready</span>
                   <Button size="sm" onClick={() => saveQuestion(q)} disabled={savingLoading === q.tempId} className="h-7 px-3 font-black text-[9px] uppercase tracking-widest">
                      {savingLoading === q.tempId ? <Loader2 className="animate-spin" size={10} /> : <><Save size={10} /> Commit Assets</>}
                   </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIGenerator;

