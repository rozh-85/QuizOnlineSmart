import { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  BookOpen, 
  Calendar,
  ChevronDown,
  Check
} from 'lucide-react';
import { Card } from '../../components/ui';
import { lectureService, lectureQAService, subscribeToAllQuestions } from '../../services/supabaseService';
import { Lecture } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import LectureQA from '../../components/LectureQA';

const QAManager = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    loadLectures();
  }, []);

  const loadLectures = async () => {
    try {
      const data = await lectureService.getAll();
      setLectures(data);
      const counts = await lectureQAService.getUnreadCountsByLecture();
      setUnreadCounts(counts);
    } catch (e) {
      console.error('Error loading lectures:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
    const lastManualUpdate = { current: 0 };
    // Track processed IDs locally to prevent double-decrements within one session
    const processedIds = new Set<string>();

    const refreshCounts = () => {
      lectureQAService.getUnreadCountsByLecture().then(setUnreadCounts).catch(console.error);
    };
    refreshCounts();

    const clearPending = () => {
      pendingTimeouts.forEach(clearTimeout);
      pendingTimeouts = [];
    };

    const scheduleFetch = (delay: number) => {
      if (Date.now() - lastManualUpdate.current < 4000) return;
      clearPending();
      pendingTimeouts.push(setTimeout(refreshCounts, delay));
      pendingTimeouts.push(setTimeout(refreshCounts, delay + 2000));
    };

    const questionsSub = subscribeToAllQuestions(() => {
      scheduleFetch(300);
    });

    const messagesSub = supabase
      .channel('qa-manager-messages-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'lecture_question_messages'
      }, () => {
        scheduleFetch(600);
      })
      .subscribe();

    const interval = setInterval(() => {
      if (Date.now() - lastManualUpdate.current > 5000) {
        refreshCounts();
      }
    }, 15000);

    const handleManualChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const threadId = detail?.id;
      const role = detail?.role;

      if (role === 'teacher' && selectedLectureId && threadId && !processedIds.has(threadId)) {
        processedIds.add(threadId);
        setUnreadCounts(prev => {
          const updated = { ...prev };
          if (updated[selectedLectureId] > 0) {
            updated[selectedLectureId] = updated[selectedLectureId] - 1;
            if (updated[selectedLectureId] <= 0) delete updated[selectedLectureId];
          }
          return updated;
        });
        lastManualUpdate.current = Date.now();
      }

      scheduleFetch(3000); // Increased delay for DB consistency
    };
    window.addEventListener('unread-count-changed', handleManualChange);

    return () => {
      questionsSub.unsubscribe();
      messagesSub.unsubscribe();
      clearInterval(interval);
      clearPending();
      window.removeEventListener('unread-count-changed', handleManualChange);
    };
  }, [selectedLectureId]);

  const filteredLectures = lectures.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-8 w-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Q&A Management</h2>
        <p className="text-slate-500 mt-1 font-medium text-sm">Monitor student discussions and publish community explanations.</p>
      </div>

      <div className="space-y-6">
        {/* Lecture Selection Dropdown */}
        <div className="relative z-20">
          {isLoading ? (
            <div className="w-full bg-white border border-slate-200 rounded-[1.2rem] p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4 w-full animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-slate-100 rounded-full" />
                  <div className="h-4 w-40 bg-slate-100 rounded-full" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-5 flex items-center justify-between shadow-sm hover:border-indigo-100 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-indigo-600 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                    <BookOpen size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">Selected Module</div>
                    <div className="text-base font-black text-slate-900 truncate max-w-[200px] sm:max-w-md">
                      {selectedLectureId ? lectures.find(l => l.id === selectedLectureId)?.title : 'Select a lecture to manage'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {selectedLectureId && unreadCounts[selectedLectureId] > 0 && (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {unreadCounts[selectedLectureId]} New
                    </div>
                  )}
                  <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 border-b border-slate-50 mb-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search modules..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-0 outline-none font-bold text-sm placeholder:text-slate-300"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                    {filteredLectures.map((lecture) => (
                      <button
                        key={lecture.id}
                        onClick={() => {
                          setSelectedLectureId(lecture.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                          selectedLectureId === lecture.id
                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            selectedLectureId === lecture.id 
                              ? 'bg-white/20 text-white' 
                              : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                          }`}>
                            <BookOpen size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-black truncate">
                              {lecture.title}
                            </div>
                            <div className={`text-[10px] font-bold opacity-60 uppercase flex items-center gap-1.5 mt-0.5 ${
                              selectedLectureId === lecture.id ? 'text-indigo-100' : 'text-slate-400'
                            }`}>
                              <Calendar size={10} />
                              {new Date(lecture.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {unreadCounts[lecture.id] > 0 && (
                            <div className={`min-w-[1.25rem] h-5 px-1.5 rounded-md flex items-center justify-center text-[10px] font-black ${
                              selectedLectureId === lecture.id 
                                ? 'bg-white text-indigo-600' 
                                : 'bg-rose-500 text-white shadow-sm'
                            }`}>
                              {unreadCounts[lecture.id]}
                            </div>
                          )}
                          {selectedLectureId === lecture.id && <Check size={16} className="text-white" />}
                        </div>
                      </button>
                    ))}
                    {filteredLectures.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-sm font-medium">
                        No lectures found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Q&A Workspace */}
        <div>
          {isLoading ? (
            <div className="h-[calc(100vh-250px)] rounded-[1.5rem] border-2 border-dashed border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-400 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Loading Q&A workspace...</h3>
              <p className="text-slate-400 text-sm font-medium mt-1">Please wait while we fetch your lectures and messages.</p>
            </div>
          ) : selectedLectureId ? (
            <Card className="p-0 sm:p-0 border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-[1.5rem] min-h-[calc(100vh-250px)] overflow-hidden">
              <LectureQA lectureId={selectedLectureId} compact isAdminView />
            </Card>
          ) : (
            <div className="h-[calc(100vh-250px)] rounded-[1.5rem] border-2 border-dashed border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-slate-300">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Select a lecture above</h3>
              <p className="text-slate-400 text-sm font-medium mt-1">Review student questions and publish help explanations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QAManager;
