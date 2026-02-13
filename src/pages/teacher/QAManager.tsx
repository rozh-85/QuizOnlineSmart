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
                className="w-full bg-white border border-slate-200 rounded-[1.2rem] p-4 flex items-center justify-between shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookOpen size={24} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Selected Lecture</div>
                    <div className="text-lg font-bold text-slate-900">
                      {selectedLectureId ? lectures.find(l => l.id === selectedLectureId)?.title : 'Select a lecture to manage'}
                    </div>
                  </div>
                </div>
                <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-[1.2rem] shadow-xl p-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search lectures..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all font-medium text-sm"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {filteredLectures.map((lecture) => (
                      <button
                        key={lecture.id}
                        onClick={() => {
                          setSelectedLectureId(lecture.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                          selectedLectureId === lecture.id
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold truncate">
                              {lecture.title}
                            </div>
                            <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                              <Calendar size={10} />
                              {new Date(lecture.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {unreadCounts[lecture.id] > 0 && (
                            <div className="min-w-[1.25rem] h-5 px-1 bg-rose-500 rounded-full border-2 border-white text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-pulse">
                              {unreadCounts[lecture.id]}
                            </div>
                          )}
                          {selectedLectureId === lecture.id && <Check size={16} className="text-indigo-600" />}
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
