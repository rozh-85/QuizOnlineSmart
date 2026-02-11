import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Trash2, 
  CheckCircle2, 
  MessageSquare, 
  ShieldCheck, 
  Star, 
  HelpCircle, 
  ArrowLeft, 
  EyeOff,
  Pencil,
  UserPlus,
  Calendar,
  Bell
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Card, TextArea, Input } from './ui';
import { 
  lectureQAService, 
  subscribeToLectureQuestions, 
  subscribeToQuestionMessages, 
  authService 
} from '../services/supabaseService';
import { LectureQuestion, LectureQuestionMessage, Profile } from '../lib/supabase';

interface LectureQAProps {
  lectureId: string;
  compact?: boolean;
  isAdminView?: boolean;
}

/* ─────────── Helpers ─────────── */
const fmtTime = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
  
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const fmtFullDate = (d: string) => {
  return new Date(d).toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }) + ' at ' + new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getSnippet = (text: string, length = 80) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
const LectureQA = ({ lectureId, compact = false, isAdminView = false }: LectureQAProps) => {
  const [questions, setQuestions] = useState<LectureQuestion[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LectureQuestionMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualData, setManualData] = useState({ id: '', question: '', answer: '', publish: true });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inbox' | 'public'>('inbox');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Precise mentor detection: Prefer profile role, fallback to local storage only if no profile is found
  const isMentor = isAdminView || (profile 
    ? (profile.role === 'teacher' || profile.role === 'admin') 
    : localStorage.getItem('teacher_auth') === 'true');

  /* ── init ── */
  useEffect(() => {
    const init = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        if (user) {
          try {
            const p = await authService.getProfile(user.id);
            setProfile(p);
          } catch (e) { 
            console.error('Error loading profile:', e); 
          }
        }
        await loadQuestions();
      } catch (e) { 
        console.error('Error initializing Q&A:', e); 
      } finally { 
        setIsLoading(false); 
      }
    };
    init();

    const qSub = subscribeToLectureQuestions(lectureId, (payload) => {
      loadQuestions();
      // Show total notification for admin if a new student question arrives
      if (isAdminView && payload.eventType === 'INSERT') {
        // Toast removed per user request - centralized in sidebar/bell
      }
    });
    
    return () => { 
      qSub.unsubscribe(); 
    };
  }, [lectureId]);

  /* ── sync selected question ── */
  useEffect(() => {
    let mSub: any = null;
    
    if (selectedQuestionId) {
      const q = questions.find(q => q.id === selectedQuestionId);
      
      const isOwner = q?.student_id === currentUser?.id;
      if (isMentor || isOwner) {
        loadMessages(selectedQuestionId);
        mSub = subscribeToQuestionMessages(selectedQuestionId, () => loadMessages(selectedQuestionId));
        
        // Mark as read if mentor selects an unread question
        if (isMentor && q && !q.is_read) {
          lectureQAService.markAsRead(selectedQuestionId).then(() => {
            // Briefly update local state so the badge disappears
            setQuestions(prev => prev.map(item => 
              item.id === selectedQuestionId ? { ...item, is_read: true } : item
            ));
          }).catch(console.error);
        }
      } else {
        setMessages([]);
      }
    }

    return () => {
      if (mSub) mSub.unsubscribe();
    };
  }, [selectedQuestionId, questions, profile, currentUser]);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  /* ── data helpers ── */
  const loadQuestions = async () => { 
    try { 
      const rawQs = await lectureQAService.getQuestionsByLecture(lectureId);
      const sorted = rawQs.sort((a, b) => {
        const timeA = a.messages && a.messages.length > 0 
          ? new Date(a.messages[a.messages.length - 1].created_at).getTime() 
          : new Date(a.created_at).getTime();
        const timeB = b.messages && b.messages.length > 0 
          ? new Date(b.messages[b.messages.length - 1].created_at).getTime() 
          : new Date(b.created_at).getTime();
        return timeB - timeA;
      });
      setQuestions(sorted); 
      
      // Also check for unread messages if mentor is already in a thread
      // (This could be expanded later for per-message notification)
    } catch (e) { 
      console.error('Error loading questions:', e); 
    } 
  };

  const loadMessages = async (qid: string) => { 
    try { 
      const msgs = await lectureQAService.getMessagesByQuestion(qid);
      setMessages(msgs); 
    } catch (e) { 
      console.error('Error loading messages:', e); 
    } 
  };

  /* ── actions ── */
  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    
    try { 
      const result = await lectureQAService.createQuestion(lectureId, newQuestion); 
      setNewQuestion(''); 
      setShowForm(false);
      if (result?.id) setSelectedQuestionId(result.id);
      loadQuestions();
      toast.success('Question sent to your mentor.');
    } catch (e: any) { 
      console.error('Error creating question:', e); 
      toast.error(`Failed to send: ${e.message || 'Unknown error'}`);
    }
  };

  const handleManualFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.question.trim() || !manualData.answer.trim()) return;
    try {
      if (manualData.id) {
        // Update existing
        await lectureQAService.updateOfficialAnswer(manualData.id, manualData.answer);
        await lectureQAService.togglePublishQuestion(manualData.id, manualData.publish);
        // Note: we might need a way to update the question text too? 
        // For now, let's assume manual FAQ is just updating answer/publish.
      } else {
        // New entry
        await lectureQAService.createQuestion(lectureId, manualData.question, manualData.publish, manualData.answer);
      }
      setManualData({ id: '', question: '', answer: '', publish: true });
      setShowManualForm(false);
      loadQuestions();
      toast.success(manualData.id ? 'FAQ updated.' : 'Manual FAQ entry added.');
    } catch (e) {
      console.error('Error in manual FAQ action:', e);
      toast.error('Operation failed.');
    }
  };

  const handleSendMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedQuestionId) return;
    try { 
      await lectureQAService.sendMessage(selectedQuestionId, newMessage, isMentor); 
      setNewMessage(''); 
    } catch (e) { 
      console.error('Error sending message:', e); 
    }
  };

  const handleTogglePublish = async (qid: string, published: boolean) => {
    try { 
      await lectureQAService.togglePublishQuestion(qid, !published); 
      loadQuestions(); 
      toast.success(published ? 'Unpublished successfully' : 'Published successfully');
    } catch (e) { 
      console.error('Error toggling publish:', e); 
      toast.error('Failed to update status.');
    }
  };


  const handleDelete = async () => {
    if (!deletingId) return;
    try { 
      await lectureQAService.deleteQuestion(deletingId); 
      if (selectedQuestionId === deletingId) setSelectedQuestionId(null); 
      setDeletingId(null);
      loadQuestions(); 
      toast.success('Deleted successfully');
    } catch (e) { 
      console.error('Error deleting question:', e); 
      toast.error('Failed to delete.');
    }
  };

  if (isLoading) return null;

  const selectedQ = questions.find(q => q.id === selectedQuestionId);
  const publishedQs = questions.filter(q => q.is_published);
  // Show ALL questions if not logged in, or filter by user ID if logged in
  const myQs = currentUser 
    ? questions.filter(q => q.student_id === currentUser.id)
    : questions; 

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <div className={`space-y-6 ${compact ? 'mt-0' : 'mt-12'} pb-8`}>
      {/* ─── Tabs ─── */}
      <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
        <button
          onClick={() => { setActiveTab('inbox'); setSelectedQuestionId(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'inbox' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MessageSquare size={14} />
          <span>Private Inbox</span>
          {questions.some(q => !q.is_read) && (
            <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-[8px] rounded-md">
              {questions.filter(q => !q.is_read).length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('public'); setSelectedQuestionId(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'public' 
              ? 'bg-white text-amber-600 shadow-sm' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Star size={14} />
          <span>Public Q&A</span>
        </button>
      </div>

      {/* ─── 1. Ask a Question (Student Entry) ─── */}
      {activeTab === 'inbox' && !isAdminView && (
        <section className="space-y-5">
          {!showForm ? (
            <div className="flex justify-center py-4">
              <Button 
                  onClick={() => setShowForm(true)}
                  className="rounded-2xl h-14 px-10 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-bold text-sm flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
              >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <MessageSquare size={18} className="text-white" />
                  </div>
                  <span>Ask Teacher a Question</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <HelpCircle size={18} />
                      </div>
                      <div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">New Inquiry</h2>
                      <p className="text-xs font-medium text-slate-500">Your question will be sent privately to the mentor.</p>
                      </div>
                  </div>
                  <button 
                      onClick={() => setShowForm(false)}
                      className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                  >
                      Cancel
                  </button>
              </div>

              <Card className="p-5 sm:p-6 border-slate-200 shadow-lg bg-white rounded-2xl relative overflow-hidden group border-b-4 border-b-indigo-500">
                  <form onSubmit={handleAsk} className="relative space-y-4">
                  <TextArea
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Describe what you're struggling with or need clarification on..."
                      rows={4}
                      autoFocus
                      className="w-full bg-slate-50/50 border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 text-sm font-medium placeholder:text-slate-300 transition-all min-h-[120px]"
                  />
                  <div className="flex justify-end gap-3">
                      <Button 
                      type="submit" 
                      disabled={!newQuestion.trim()} 
                      className="rounded-xl h-11 px-8 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-md shadow-indigo-100"
                      >
                      <span>Send to Teacher</span>
                      <Send size={14} />
                      </Button>
                  </div>
                  </form>
              </Card>
            </div>
          )}
        </section>
      )}

      {/* ─── 1.5 Admin Manual FAQ Entry ─── */}
      {activeTab === 'public' && isAdminView && (
        <section className="space-y-5">
           {!showManualForm ? (
             <div className="flex justify-end">
               <Button 
                onClick={() => setShowManualForm(true)}
                className="rounded-xl h-10 px-5 bg-indigo-600 hover:bg-indigo-700 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"
               >
                 <UserPlus size={14} />
                 <span>{manualData.id ? 'Edit FAQ' : 'Add Manual FAQ'}</span>
               </Button>
             </div>
           ) : (
             <Card className="p-8 border-slate-200 bg-white shadow-2xl rounded-3xl animate-in fade-in slide-in-from-top-2 border-b-8 border-b-indigo-600">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{manualData.id ? 'Edit FAQ Item' : 'Add FAQ Entry'}</h3>
                    <p className="text-xs font-medium text-slate-500">{manualData.id ? 'Update the public explanation.' : 'Create a public question and answer for all students.'}</p>
                  </div>
                  <button onClick={() => { setShowManualForm(false); setManualData({ id: '', question: '', answer: '', publish: true }); }} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                </div>
                <form onSubmit={handleManualFAQ} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Student Question</label>
                    <Input 
                      placeholder="e.g. How do I calculate the variance?"
                      value={manualData.question}
                      onChange={e => setManualData({...manualData, question: e.target.value})}
                      className="bg-slate-50 border-slate-100 font-medium h-12 rounded-xl focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mentor Explanation</label>
                    <TextArea 
                      placeholder="Provide the official high-quality answer..."
                      value={manualData.answer}
                      onChange={e => setManualData({...manualData, answer: e.target.value})}
                      rows={5}
                      className="bg-slate-50 border-slate-100 font-medium rounded-xl focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${manualData.publish ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${manualData.publish ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={manualData.publish}
                        onChange={e => setManualData({...manualData, publish: e.target.checked})}
                      />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Visible to students</span>
                    </label>

                    <Button type="submit" disabled={!manualData.question.trim() || !manualData.answer.trim()} 
                      className="rounded-xl h-12 px-10 bg-indigo-600 hover:bg-indigo-700 font-bold text-sm shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95">
                      {manualData.id ? 'Update FAQ' : 'Save & Publish'}
                    </Button>
                  </div>
                </form>
             </Card>
           )}
        </section>
      )}

      {/* ─── 2. Messaging Inbox (Admins) / My Threads (Students) ─── */}
      {activeTab === 'inbox' && (() => {
        const list = isMentor ? questions : myQs;
        if (list.length === 0 && !isMentor) return null;

        if (selectedQ) {
          return (
            <div className="space-y-5">
              <button
                onClick={() => setSelectedQuestionId(null)}
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
              >
                <ArrowLeft size={14} /> Back to {isMentor ? 'Inbox' : 'My Questions'}
              </button>

              <div className="space-y-5">
                {/* Chat & Controls Container */}
                <div className="flex flex-col h-[650px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden rounded-[2rem]">
                  {/* Enhanced Header with Admin Controls */}
                  <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-black text-indigo-600">
                        {selectedQ.student?.full_name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <div className="text-base font-black text-slate-900 leading-tight">
                          {selectedQ.student?.full_name || 'Anonymous Student'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck size={10} /> Private Message
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdminView && (
                        <Button variant="ghost" size="sm" onClick={() => setDeletingId(selectedQ.id)}
                            className="h-9 w-9 p-0 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                        >
                            <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>


                  {/* Message History */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 custom-scrollbar">
                    {/* The original question */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] bg-white border border-slate-100 rounded-[1.5rem] rounded-tl-none p-5 shadow-sm">
                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <HelpCircle size={12} /> Student Inquiry
                        </div>
                        <p className="text-sm font-medium text-slate-800 leading-relaxed italic">"{selectedQ.question_text}"</p>
                        <div className="text-[10px] font-bold text-slate-300 mt-3 flex items-center gap-2">
                          <Calendar size={10} />
                          {fmtFullDate(selectedQ.created_at)}
                        </div>
                      </div>
                    </div>

                    {messages.map((m: LectureQuestionMessage) => {
                      const isMe = m.sender_id === currentUser?.id;
                      const senderIsMentor = m.sender?.role === 'teacher' || m.sender?.role === 'admin';
                      return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-[1.5rem] p-5 ${
                            isMe
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 rounded-tr-none'
                              : senderIsMentor
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 rounded-tl-none'
                                : 'bg-white border border-slate-100 text-slate-800 shadow-sm rounded-tl-none'
                          }`}>
                            {!isMe && (
                              <div className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${senderIsMentor ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {m.sender?.full_name || 'User'} {senderIsMentor && '· Mentor'}
                              </div>
                            )}
                            <p className="text-sm font-medium leading-relaxed">{m.message_text}</p>
                            <div className={`text-[10px] mt-3 font-bold flex items-center gap-2 ${isMe || senderIsMentor ? 'opacity-60' : 'text-slate-300'}`}>
                              <Calendar size={10} />
                              {fmtFullDate(m.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-6 bg-white border-t border-slate-100">
                    <form onSubmit={handleSendMsg} className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-slate-300"
                      />
                      <Button type="submit" disabled={!newMessage.trim()} className="rounded-2xl h-[52px] w-[52px] !p-0 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-20 flex-shrink-0 transition-all hover:scale-105 active:scale-95">
                        <Send size={20} />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // --- Inbox List View ---
        return (
          <section className="space-y-5">
            {!compact && (
              <div className="flex items-center gap-3 px-1">
                <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center relative">
                  <Bell size={18} />
                  {questions.some(q => !q.is_read) && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {isMentor ? 'Inquiries' : 'My Questions'}
                  </h2>
                  <p className="text-xs font-medium text-slate-500">
                    {isMentor ? 'Review and respond to private student messages.' : 'Follow up on your private inquiries.'}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {list.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-100 bg-white">
                  <p className="text-slate-400 font-bold text-sm">No conversations yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {list.map((q: LectureQuestion) => {
                    const lastMsg = q.messages && q.messages.length > 0 ? q.messages[q.messages.length - 1] : null;
                    const displayTime = lastMsg ? lastMsg.created_at : q.created_at;
                    const snippet = lastMsg ? lastMsg.message_text : q.question_text;
                    const isActive = selectedQuestionId === q.id;
                    
                    return (
                      <div
                        key={q.id}
                        onClick={() => setSelectedQuestionId(q.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                          isActive
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                            isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                          }`}>
                            {q.student?.full_name?.charAt(0) || 'S'}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800 truncate">
                                  {isMentor ? q.student?.full_name : 'Mentor Response'}
                                </span>
                                {isMentor && !q.is_read && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500 text-[8px] text-white font-black uppercase tracking-wider animate-pulse">
                                    New
                                  </span>
                                )}
                                {q.is_published && <Star size={10} className="text-amber-500 fill-amber-500" />}
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                {fmtTime(displayTime)}
                              </span>
                            </div>
                            
                            <p className="text-xs font-medium text-slate-500 line-clamp-1">
                              {getSnippet(snippet, 80)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* ─── 3. Published FAQ (Community Q&A) ─── */}
      {activeTab === 'public' && publishedQs.length > 0 && !selectedQ && (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star size={18} className="fill-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Public Q&A</h2>
              <p className="text-sm font-medium text-slate-500">Most common inquiries and explanations.</p>
            </div>
          </div>

          <div className="space-y-0 divide-y divide-slate-100">
            {publishedQs.map((q: LectureQuestion) => (
              <div key={q.id} className="py-8 first:pt-2">
                 <div className="space-y-4 w-full">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <HelpCircle size={20} />
                      </div>
                      <div className="pt-1 flex-1">
                        <h4 className="text-lg font-bold text-slate-800 leading-snug">{q.question_text}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                            Anonymous
                          </span>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                            • {new Date(q.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {q.official_answer && (
                      <div className="pl-14">
                         <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-r-[2rem] rounded-bl-[2rem] p-6 border border-indigo-50/50 relative overflow-hidden group hover:shadow-sm transition-shadow">
                            <div className="absolute top-0 right-0 p-3 opacity-5 text-indigo-600">
                              <ShieldCheck size={64} />
                            </div>
                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <div className="p-1 bg-indigo-100 rounded-full">
                                <CheckCircle2 size={12} /> 
                               </div>
                               Mentor's Explanation
                            </div>
                            <p className="text-base font-medium text-slate-700 leading-relaxed whitespace-pre-wrap relative z-10">
                              {q.official_answer}
                            </p>
                         </div>
                      </div>
                    )}
                </div>
                 
                 {isAdminView && (
                   <div className="flex items-center gap-2 mt-4 pl-14 pt-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => {
                          setManualData({
                            id: q.id,
                            question: q.question_text,
                            answer: q.official_answer || '',
                            publish: q.is_published
                          });
                          setShowManualForm(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-slate-100 text-indigo-600 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Pencil size={12} /> Edit explanation
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleTogglePublish(q.id, q.is_published)}
                        className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                      >
                        <EyeOff size={12} /> Unpublish
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDeletingId(q.id)}
                        className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <Trash2 size={12} /> Delete
                      </Button>
                   </div>
                 )}
              </div>
            ))}
          </div>
        </section>
      )}
      {/* ── Custom Delete Modal ── */}
      {deletingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60" 
            onClick={() => setDeletingId(null)} 
          />
          <Card className="relative w-full max-w-[320px] bg-white border border-slate-200 shadow-xl rounded-2xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">
                Are you sure you want to delete this? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="ghost"
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-2.5 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-sm"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LectureQA;
