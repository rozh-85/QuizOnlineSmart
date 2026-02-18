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
  Bell,
  ImagePlus,
  X,
  MoreVertical
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Card, TextArea, Input } from './ui';
import { 
  lectureQAService, 
  subscribeToLectureQuestions, 
  subscribeToQuestionMessages, 
  authService,
  addTeacherReadTimestamp,
  getTeacherReadMap 
} from '../services/supabaseService';
import { LectureQuestion, LectureQuestionMessage, Profile } from '../lib/supabase';

interface LectureQAProps {
  lectureId: string;
  compact?: boolean;
  isAdminView?: boolean;
  initialThreadId?: string;
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

// Use shared localStorage-based read tracking from supabaseService.
// addTeacherReadTimestamp stores { threadId: isoTimestamp } so that
// getUnreadCount / getUnreadCountsByLecture can filter out threads
// the teacher already read, even if the DB update was blocked by RLS.
const addTeacherReadId = addTeacherReadTimestamp;

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
const LectureQA = ({ lectureId, compact = false, isAdminView = false, initialThreadId }: LectureQAProps) => {
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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        
        if (isMentor && q && !q.is_read) {
          // Optimistic local state update: mark as read locally and update all teacher counters immediately
          setQuestions(prev => prev.map(item => 
            item.id === selectedQuestionId ? { ...item, is_read: true } : item
          ));
          addTeacherReadId(selectedQuestionId);

          // Immediately notify sidebar / lecture list to decrement unread,
          // without waiting for the DB call to succeed
          window.dispatchEvent(new CustomEvent('unread-count-changed', { 
            detail: { id: selectedQuestionId, role: 'teacher' } 
          }));

          // Persist read state in the database - await and handle errors properly
          lectureQAService.markAsRead(selectedQuestionId)
            .then(() => {
              console.log('[Q&A] Successfully marked thread as read:', selectedQuestionId);
              // Fire event again after backend confirms (in case first one was missed)
              window.dispatchEvent(new CustomEvent('unread-count-changed', { 
                detail: { id: selectedQuestionId, role: 'teacher' } 
              }));
            })
            .catch((err) => {
              console.error('[Q&A] Failed to mark thread as read in backend:', selectedQuestionId, err);
              // Even if backend fails, localStorage will keep it marked as read
            });
        }
        
        if (!isMentor && q && !q.is_read_by_student) {
          // Optimistic local state update
          setQuestions(prev => prev.map(item => item.id === selectedQuestionId ? { ...item, is_read_by_student: true } : item));

          lectureQAService.markAsRead(selectedQuestionId, true).then(() => {
            window.dispatchEvent(new CustomEvent('unread-count-changed', { 
              detail: { id: selectedQuestionId, role: 'student' } 
            }));
          }).catch(console.error);
        }

        // Subscribe to new messages
        mSub = subscribeToQuestionMessages(selectedQuestionId, (payload) => {
          loadMessages(selectedQuestionId);
          
          // If we receive a new message while viewing, mark it as read
          if (payload.eventType === 'INSERT') {
            const isMyMsg = payload.new.sender_id === currentUser?.id;
            if (isMentor) {
              // If teacher is viewing and it's a student message (NOT my msg), mark as read
              if (!isMyMsg) {
                // Optimistic update
                setQuestions(prev => prev.map(i => i.id === selectedQuestionId ? { ...i, is_read: true } : i));
                addTeacherReadId(selectedQuestionId);
                window.dispatchEvent(new CustomEvent('unread-count-changed', { detail: { id: selectedQuestionId, role: 'teacher' } }));
                lectureQAService.markAsRead(selectedQuestionId).catch(console.error);
              }
            } else {
              // If student is viewing and it's a teacher message (NOT my msg), mark as read
              if (!isMyMsg) {
                setQuestions(prev => prev.map(i => i.id === selectedQuestionId ? { ...i, is_read_by_student: true } : i));
                window.dispatchEvent(new CustomEvent('unread-count-changed', { detail: { id: selectedQuestionId, role: 'student' } }));
                lectureQAService.markAsRead(selectedQuestionId, true).catch(console.error);
              }
            }
          }
        });
      } else {
        setMessages([]);
      }
    }

    return () => {
      if (mSub) mSub.unsubscribe();
    };
  }, [selectedQuestionId, profile, currentUser, questions]); // Added 'questions' dependency

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

      // Apply local mentor read-state override so that after refresh, any
      // thread the teacher has already opened on this device stays "read"
      // even if the backend flag didn't update for some reason.
      const teacherRead = getTeacherReadMap();
      const adjusted = sorted.map(q => ({
        ...q,
        is_read: (teacherRead[q.id] && new Date(q.updated_at) <= new Date(teacherRead[q.id])) ? true : q.is_read
      }));

      setQuestions(adjusted);

      // Auto-select thread from notification click
      if (initialThreadId && !selectedQuestionId) {
        const found = sorted.find(q => q.id === initialThreadId);
        if (found) {
          setSelectedQuestionId(initialThreadId);
        }
      }
    } catch (e) { 
      console.error('Error loading questions:', e); 
    } 
  };

  const loadMessages = async (qid: string) => { 
    try { 
      const msgs = await lectureQAService.getMessagesByQuestion(qid);
      setMessages(msgs); 
    } catch (e: any) { 
      console.error('[DEBUG] Error loading messages for question:', qid, e); 
      toast.error('Could not load chat history.');
    } 
  };

  /* ── actions ── */
  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() && selectedImages.length === 0) return;
    
    try {
      setIsUploading(true);
      const result = await lectureQAService.createQuestion(lectureId, newQuestion || 'Question with photo'); 
      setNewQuestion(''); 
      setShowForm(false);
      if (result?.id) {
        // Upload all images and send as one message
        if (selectedImages.length > 0) {
          const urls: string[] = [];
          for (const img of selectedImages) {
            urls.push(await lectureQAService.uploadChatImage(img));
          }
          await lectureQAService.sendMessage(result.id, '📷 Photo', false, urls);
        }
        clearSelectedImages();
        setSelectedQuestionId(result.id);
        // Immediately load messages so the images appear
        await loadMessages(result.id);
      }
      loadQuestions();
      window.dispatchEvent(new CustomEvent('unread-count-changed', { 
        detail: { id: result.id, role: 'student' } 
      }));
      toast.success('Question sent to your mentor.');
    } catch (e: any) { 
      console.error('Error creating question:', e); 
      toast.error(`Failed to send: ${e.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        newFiles.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
    setSelectedImages(prev => [...prev, ...newFiles]);
    // Reset the input so the same files can be re-selected
    if (e.target) e.target.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearSelectedImages = () => {
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleSendMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedImages.length === 0) || !selectedQuestionId) return;
    try {
      setIsUploading(true);
      // Upload all images first
      const uploadedUrls: string[] = [];
      if (selectedImages.length > 0) {
        try {
          for (const img of selectedImages) {
            const url = await lectureQAService.uploadChatImage(img);
            uploadedUrls.push(url);
          }
        } catch (uploadError: any) {
          console.error('[Q&A] Image upload failed:', uploadError);
          toast.error(`Failed to upload image: ${uploadError.message || 'Unknown error'}`);
          setIsUploading(false);
          return;
        }
      }
      
      // Send as one message with text + all images
      const text = newMessage.trim() || (uploadedUrls.length > 0 ? '📷 Photo' : '');
      
      try {
        await lectureQAService.sendMessage(selectedQuestionId, text, isMentor, uploadedUrls.length > 0 ? uploadedUrls : undefined);
      } catch (sendError: any) {
        console.error('[Q&A] Failed to send message:', sendError);
        toast.error(`Failed to send message: ${sendError.message || 'Unknown error'}`);
        setIsUploading(false);
        return;
      }
      
      setNewMessage('');
      clearSelectedImages();
      
      // If mentor sends a message, mark as read locally and notify counts IMMEDIATELY
      if (isMentor) {
        // Update local state immediately
        setQuestions(prev => prev.map(q => 
          q.id === selectedQuestionId ? { ...q, is_read: true, is_read_by_student: false } : q
        ));
        addTeacherReadId(selectedQuestionId);
        
        // CRITICAL: Fire event IMMEDIATELY to update sidebar badge
        window.dispatchEvent(new CustomEvent('unread-count-changed', { 
          detail: { id: selectedQuestionId, role: 'teacher' } 
        }));
        
        // Ensure backend is marked as read - this is critical for persistence
        lectureQAService.markAsRead(selectedQuestionId)
          .then(() => {
            console.log('[Q&A] Thread marked as read after teacher sent message:', selectedQuestionId);
            // Fire event again after backend confirms (in case first one was missed)
            window.dispatchEvent(new CustomEvent('unread-count-changed', { 
              detail: { id: selectedQuestionId, role: 'teacher' } 
            }));
          })
          .catch((err) => {
            console.error('[Q&A] Failed to mark thread as read after sending message:', selectedQuestionId, err);
            // Even if backend fails, localStorage will keep it marked as read
          });
      }

      // Immediately reload messages so the images appear
      await loadMessages(selectedQuestionId);
      toast.success(uploadedUrls.length > 0 ? 'Message with images sent successfully!' : 'Message sent successfully!');
    } catch (e: any) {
      console.error('[Q&A] Unexpected error sending message:', e);
      toast.error(`Failed to send message: ${e.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editingText.trim()) return;
    const savedText = editingText;
    // Optimistic local update so the change appears immediately
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, message_text: savedText } : m));
    setEditingMessageId(null);
    setEditingText('');
    try {
      await lectureQAService.editMessage(messageId, savedText);
      if (selectedQuestionId) await loadMessages(selectedQuestionId);
      toast.success('Message updated.');
    } catch (e: any) {
      console.error('Error editing message:', e);
      // Revert optimistic update on failure
      if (selectedQuestionId) await loadMessages(selectedQuestionId);
      toast.error(e?.message || 'Failed to edit message.');
    }
  };

  const handleDeleteMessage = async () => {
    if (!deletingMsgId) return;
    try {
      await lectureQAService.deleteMessage(deletingMsgId);
      setDeletingMsgId(null);
      if (selectedQuestionId) await loadMessages(selectedQuestionId);
      toast.success('Message deleted.');
    } catch (e) {
      console.error('Error deleting message:', e);
      toast.error('Failed to delete message.');
    }
  };

  const handleEditQuestion = async (questionId: string) => {
    if (!editingQuestionText.trim()) return;
    try {
      await lectureQAService.editQuestion(questionId, editingQuestionText);
      setEditingQuestionId(null);
      setEditingQuestionText('');
      loadQuestions();
      toast.success('Question updated.');
    } catch (e) {
      console.error('Error editing question:', e);
      toast.error('Failed to edit question.');
    }
  };

  // Helper to parse image_url which can be a single URL or JSON array
  const parseImageUrls = (imageUrl: string | null | undefined): string[] => {
    if (!imageUrl) return [];
    try {
      if (imageUrl.startsWith('[')) {
        return JSON.parse(imageUrl);
      }
    } catch {}
    return [imageUrl];
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
      window.dispatchEvent(new CustomEvent('unread-count-changed', { 
        detail: { id: deletingId, role: isMentor ? 'teacher' : 'student' } 
      }));
      toast.success('Deleted successfully');
    } catch (e) { 
      console.error('Error deleting question:', e); 
      toast.error('Failed to delete.');
    }
  };

  if (isLoading) return (
    <div className="space-y-6 pb-8">
      {/* Skeleton tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl">
        <div className="flex-1 py-2.5 flex items-center justify-center">
          <div className="w-28 h-4 rounded bg-slate-200/60 animate-pulse" />
        </div>
        <div className="flex-1 py-2.5 flex items-center justify-center">
          <div className="w-24 h-4 rounded bg-slate-200/60 animate-pulse" />
        </div>
      </div>
      {/* Skeleton button */}
      <div className="flex justify-center py-4">
        <div className="w-56 h-12 rounded-2xl bg-slate-200/60 animate-pulse" />
      </div>
      {/* Skeleton thread list */}
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white animate-pulse flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-200/60 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-3/4 h-4 rounded bg-slate-200/60" />
              <div className="w-1/2 h-3 rounded bg-slate-200/60" />
            </div>
            <div className="w-14 h-3 rounded bg-slate-200/60" />
          </div>
        ))}
      </div>
    </div>
  );

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
    <div className={`space-y-6 ${compact ? 'mt-0' : 'sm:mt-12 mt-6'} pb-8`}>
      {/* ─── Tabs ─── */}
      <div className="flex p-1 bg-slate-100 rounded-xl sm:mb-6 mb-4">
        <button
          onClick={() => { setActiveTab('inbox'); setSelectedQuestionId(null); }}
          className={`flex-1 flex items-center justify-center gap-2 sm:py-2.5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'inbox' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MessageSquare size={14} />
          <span>Private Inbox</span>
        </button>
        <button
          onClick={() => { setActiveTab('public'); setSelectedQuestionId(null); }}
          className={`flex-1 flex items-center justify-center gap-2 sm:py-2.5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
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
                  className="rounded-2xl sm:h-14 h-12 sm:px-10 px-8 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-bold text-sm flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
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

              <Card className="p-4 sm:p-6 border-slate-200 shadow-lg bg-white rounded-2xl relative overflow-hidden group border-b-4 border-b-indigo-500">
                  <form onSubmit={handleAsk} className="relative space-y-4">
                  <TextArea
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Describe what you're struggling with or need clarification on..."
                      rows={4}
                      autoFocus
                      className="w-full bg-slate-50/50 border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 text-sm font-medium placeholder:text-slate-300 transition-all min-h-[120px]"
                  />
                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img src={preview} alt="Preview" className="h-16 w-16 object-cover rounded-xl border-2 border-indigo-200" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <ImagePlus size={18} />
                          <span>Attach Photo</span>
                        </button>
                      </div>
                      <Button 
                      type="submit" 
                      disabled={(!newQuestion.trim() && selectedImages.length === 0) || isUploading} 
                      className="rounded-xl h-11 px-8 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-md shadow-indigo-100"
                      >
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <>
                          <span>Send to Teacher</span>
                          <Send size={14} />
                        </>
                      )}
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
                <div className="flex flex-col h-[500px] sm:h-[650px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
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
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/20 custom-scrollbar">
                    {/* The original question */}
                    <div className={`flex ${!isMentor ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-[1.2rem] p-3 px-4 relative ${
                        !isMentor
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 rounded-tr-none'
                          : 'bg-white border border-slate-100 text-slate-800 shadow-sm rounded-tl-none'
                      }`}>
                        {/* Edit question menu */}
                        {isMentor && editingQuestionId !== selectedQ.id && (
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === 'q-' + selectedQ.id ? null : 'q-' + selectedQ.id); }}
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                                !isMentor ? 'hover:bg-white/20 text-white/60 hover:text-white' : 'hover:bg-slate-100 text-slate-300 hover:text-slate-500'
                              }`}
                            >
                              <MoreVertical size={14} />
                            </button>
                            {menuOpenId === 'q-' + selectedQ.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                                <div className="absolute z-50 mt-1 right-0 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                                  <button
                                    onClick={() => { setEditingQuestionId(selectedQ.id); setEditingQuestionText(selectedQ.question_text); setMenuOpenId(null); }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                  >
                                    <Pencil size={13} />
                                    Edit
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-2 ${!isMentor ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {selectedQ.student?.full_name || 'Student'}
                        </div>
                        {editingQuestionId === selectedQ.id ? (
                          <div className="space-y-2 min-w-[180px]">
                            <input
                              type="text"
                              value={editingQuestionText}
                              onChange={(e) => setEditingQuestionText(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-800 outline-none"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === 'Enter') handleEditQuestion(selectedQ.id); if (e.key === 'Escape') setEditingQuestionId(null); }}
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingQuestionId(null)} className="px-3 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                              <button onClick={() => handleEditQuestion(selectedQ.id)} className="px-3 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">Save</button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-[13px] font-medium leading-relaxed italic ${!isMentor ? 'text-white' : 'text-slate-800'}`}>"{selectedQ.question_text}"</p>
                        )}
                        <div className={`text-[10px] font-bold mt-2 flex items-center gap-2 ${!isMentor ? 'opacity-60' : 'text-slate-300'}`}>
                          <Calendar size={10} />
                          {fmtFullDate(selectedQ.created_at)}
                        </div>
                      </div>
                    </div>

                    {messages.map((m: LectureQuestionMessage) => {
                      // Use is_from_teacher flag (reliable even when teacher/student share session)
                      const isTeacherMessage = m.is_from_teacher === true;
                      const isStudentMessage = !isTeacherMessage;
                      // Alignment: teacher sees teacher msgs on right, student sees student msgs on right
                      const isMe = isMentor ? isTeacherMessage : isStudentMessage;
                      
                      // Permission logic: 
                      // 1. Teachers/Admins can edit/delete any message.
                      // 2. Students can only edit their own messages.
                      const canEdit = isMentor;
                      const canDelete = isMentor;
                      const hasActions = canEdit || canDelete;
                      
                      return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {/* ── Message bubble ── */}
                          <div className={`max-w-[85%] rounded-[1.2rem] p-3 px-4 relative ${
                            isMe
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 rounded-tr-none'
                              : 'bg-white border border-slate-100 text-slate-800 shadow-sm rounded-tl-none'
                          }`}>
                            {/* 3-dot menu trigger */}
                            {hasActions && editingMessageId !== m.id && (
                              <div className="absolute top-2 right-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === m.id ? null : m.id); }}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                                    isMe
                                      ? 'hover:bg-white/20 text-white/60 hover:text-white'
                                      : 'hover:bg-slate-100 text-slate-300 hover:text-slate-500'
                                  }`}
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {/* Dropdown */}
                                {menuOpenId === m.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                                    <div className={`absolute z-50 mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
                                      isMe ? 'right-0' : 'left-0'
                                    }`}>
                                      {canEdit && (
                                        <button
                                          onClick={() => { setEditingMessageId(m.id); setEditingText(m.message_text === '📷 Photo' ? '' : m.message_text); setMenuOpenId(null); }}
                                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                        >
                                          <Pencil size={13} />
                                          Edit
                                        </button>
                                      )}
                                      {canDelete && (
                                        <button
                                          onClick={() => { setDeletingMsgId(m.id); setMenuOpenId(null); }}
                                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
                                        >
                                          <Trash2 size={13} />
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Role labels / Names */}
                            {isStudentMessage && (
                              <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-2 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {m.sender?.full_name || selectedQ.student?.full_name || 'Student'}
                              </div>
                            )}
                            {isTeacherMessage && (
                              <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-2 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                Teacher
                              </div>
                            )}
                            {m.image_url && (() => {
                              const urls = parseImageUrls(m.image_url);
                              if (urls.length === 1) return (
                                <img
                                  src={urls[0]}
                                  alt="Attached"
                                  onClick={() => setViewingImage(urls[0])}
                                  className="rounded-xl max-w-full max-h-[200px] object-cover mb-2 cursor-pointer hover:opacity-90 transition-opacity border border-white/20"
                                />
                              );
                              return (
                                <div className={`grid gap-1.5 mb-2 ${urls.length === 2 ? 'grid-cols-2' : urls.length >= 3 ? 'grid-cols-2' : ''}`}>
                                  {urls.map((url, idx) => (
                                    <img
                                      key={idx}
                                      src={url}
                                      alt={`Photo ${idx + 1}`}
                                      onClick={() => setViewingImage(url)}
                                      className="rounded-lg w-full h-[120px] object-cover cursor-pointer hover:opacity-90 transition-opacity border border-white/20"
                                    />
                                  ))}
                                </div>
                              );
                            })()}
                            {/* Editing mode */}
                            {editingMessageId === m.id ? (
                              <div className="space-y-2 min-w-[180px]">
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className={`w-full rounded-lg px-3 py-2 text-[13px] font-medium outline-none ${
                                    isMe
                                      ? 'bg-white/20 border border-white/30 text-white placeholder:text-white/50'
                                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                                  }`}
                                  autoFocus
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleEditMessage(m.id); if (e.key === 'Escape') setEditingMessageId(null); }}
                                />
                                <div className="flex gap-2 justify-end">
                                  <button 
                                    onClick={() => setEditingMessageId(null)} 
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                      isMe ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => handleEditMessage(m.id)} 
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                      isMe ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                    }`}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {m.message_text && m.message_text !== '📷 Photo' && (
                                  <p className="text-[13px] font-medium leading-relaxed">{m.message_text}</p>
                                )}
                                {m.message_text === '📷 Photo' && !m.image_url && (
                                  <p className="text-[13px] font-medium leading-relaxed">{m.message_text}</p>
                                )}
                              </>
                            )}
                            <div className={`text-[10px] mt-2 font-bold flex items-center gap-2 ${isMe ? 'opacity-60' : 'text-slate-300'}`}>
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
                  <div className="p-4 sm:p-6 bg-white border-t border-slate-100">
                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {imagePreviews.map((preview, idx) => (
                          <div key={idx} className="relative">
                            <img src={preview} alt="Preview" className="h-16 w-16 object-cover rounded-xl border-2 border-indigo-200" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <form onSubmit={handleSendMsg} className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-2xl sm:h-[48px] h-[44px] sm:w-[48px] w-[44px] flex-shrink-0 flex items-center justify-center bg-slate-100 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all"
                      >
                        <ImagePlus size={20} />
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1 bg-slate-50 border-none rounded-2xl sm:px-6 px-4 sm:py-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-slate-300"
                      />
                      <Button type="submit" disabled={(!newMessage.trim() && selectedImages.length === 0) || isUploading} className="rounded-2xl sm:h-[48px] h-[44px] sm:w-[48px] w-[44px] !p-0 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-20 flex-shrink-0 transition-all hover:scale-105 active:scale-95">
                        {isUploading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send size={20} />
                        )}
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
                        onClick={() => {
                          // Optimistically mark as read as soon as teacher opens the thread
                          if (isMentor && !q.is_read) {
                            setQuestions(prev => prev.map(item =>
                              item.id === q.id ? { ...item, is_read: true } : item
                            ));
                            addTeacherReadId(q.id);

                            window.dispatchEvent(new CustomEvent('unread-count-changed', { 
                              detail: { id: q.id, role: 'teacher' } 
                            }));

                            lectureQAService.markAsRead(q.id)
                              .then(() => {
                                console.log('[Q&A] Marked thread as read from list click:', q.id);
                              })
                              .catch((err) => {
                                console.error('[Q&A] Failed to mark thread as read from list:', q.id, err);
                              });
                          }

                          setSelectedQuestionId(q.id);
                        }}
                        className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                          isActive
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                            isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                          }`}>
                            {q.student?.full_name?.charAt(0) || 'S'}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-bold text-slate-800 truncate">
                                    {isMentor ? q.student?.full_name : 'Mentor Response'}
                                  </span>
                                  {q.is_published && <Star size={10} className="text-amber-500 fill-amber-500" />}
                                </div>
                                <p className="text-xs font-medium text-slate-500 line-clamp-1">
                                  {getSnippet(snippet, 80)}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                  {fmtTime(displayTime)}
                                </span>
                                {isMentor && !q.is_read && (
                                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 text-[9px] text-white font-black uppercase tracking-widest shadow-lg shadow-rose-100 animate-in fade-in zoom-in duration-300">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                    </span>
                                    New
                                  </span>
                                )}
                              </div>
                            </div>
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
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <HelpCircle size={20} />
                      </div>
                      <div className="pt-1 flex-1">
                        <h4 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">{q.question_text}</h4>
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
                      <div className="pl-0 sm:pl-14">
                         <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-[1.5rem] sm:rounded-r-[2rem] sm:rounded-bl-[2rem] p-4 sm:p-6 border border-indigo-50/50 relative overflow-hidden group hover:shadow-sm transition-shadow">
                            <div className="absolute top-0 right-0 p-3 opacity-5 text-indigo-600">
                              <ShieldCheck size={64} />
                            </div>
                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <div className="p-1 bg-indigo-100 rounded-full">
                                <CheckCircle2 size={12} /> 
                               </div>
                               Mentor's Explanation
                            </div>
                            <p className="text-sm sm:text-base font-medium text-slate-700 leading-relaxed whitespace-pre-wrap relative z-10">
                              {q.official_answer}
                            </p>
                         </div>
                      </div>
                    )}
                </div>
                 
                 {isAdminView && (
                   <div className="flex flex-wrap items-center gap-2 mt-4 pl-0 sm:pl-14 pt-2">
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
      {/* ── Fullscreen Image Viewer ── */}
      {viewingImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setViewingImage(null)}>
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
          <img src={viewingImage} alt="Full view" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      {/* ── Delete Message Modal ── */}
      {deletingMsgId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60" 
            onClick={() => setDeletingMsgId(null)} 
          />
          <Card className="relative w-full max-w-[320px] bg-white border border-slate-200 shadow-xl rounded-2xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Message</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">
                Are you sure you want to delete this message? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="ghost"
                  onClick={() => setDeletingMsgId(null)}
                  className="flex-1 py-2.5 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeleteMessage}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-sm"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
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
