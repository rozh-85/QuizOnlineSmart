import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, ChevronRight } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { lectureQAApi } from '../../api/lectureQAApi';
import { subscribeToStudentQuestions } from '../../services/realtimeService';

const StudentNotifications = () => {
  const [unreadThreads, setUnreadThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userIdRef = useRef<string | null>(null);

  const fetchUnread = useCallback(async (userId: string) => {
    try {
      const threads = await lectureQAApi.getStudentUnreadThreads(userId);
      setUnreadThreads(threads);
    } catch (e) {
      console.error('Error fetching unread:', e);
    }
  }, []);

  useEffect(() => {
    let sub: any = null;
    let mounted = true;

    const init = async () => {
      try {
        const user = await authApi.getCurrentUser();
        if (!mounted) return;
        if (!user) { navigate('/login', { replace: true }); return; }

        userIdRef.current = user.id;
        await fetchUnread(user.id);

        // Remove any stale channel with the same name before subscribing
        const channelName = 'student-notif-page-' + user.id;
        try { (await import('../../lib/supabase')).supabase.removeChannel((await import('../../lib/supabase')).supabase.channel(channelName)); } catch { /* ignore */ }

        sub = subscribeToStudentQuestions(user.id, channelName, () => {
          if (mounted) fetchUnread(user.id);
        });
      } catch (e) {
        console.error('Notifications fetch error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();

    // Also refresh when other components signal unread-count changes
    const handleCountChange = () => {
      if (userIdRef.current) fetchUnread(userIdRef.current);
    };
    window.addEventListener('unread-count-changed', handleCountChange);

    return () => {
      mounted = false;
      window.removeEventListener('unread-count-changed', handleCountChange);
      if (sub) sub.unsubscribe();
    };
  }, [navigate, fetchUnread]);

  const fmtRelative = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getLastMessage = (thread: any) => {
    if (!thread.messages || thread.messages.length === 0) return null;
    // Sort newest first, return the very latest message
    const sorted = [...thread.messages].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0];
  };

  const isTeacherMessage = (msg: any, thread: any) => {
    if (thread.student_id && msg.sender_id && msg.sender_id !== thread.student_id) return true;
    const role = msg.sender?.role || msg.profiles?.role;
    return role === 'teacher' || role === 'admin';
  };

  const handleNotificationClick = async (thread: any) => {
    try {
      // 1. Update database first
      await lectureQAApi.markAsRead(thread.id, true);
      // 2. DB succeeded → update local list
      setUnreadThreads(prev => prev.filter(t => t.id !== thread.id));
      // 3. Instant nav bar badge decrement
      window.dispatchEvent(new Event('unread-count-decrement'));
      // 4. Navigate to lecture chat
      navigate(`/quiz?lectureId=${thread.lecture_id}&threadId=${thread.id}`);
      // 5. Backup: re-sync badge with DB after navigation
      setTimeout(() => {
        window.dispatchEvent(new Event('unread-count-changed'));
      }, 500);
    } catch (e) {
      console.error('Failed to mark chat as read:', e);
      // DB failed → still navigate but force a re-sync so badge stays accurate
      navigate(`/quiz?lectureId=${thread.lecture_id}&threadId=${thread.id}`);
      setTimeout(() => {
        window.dispatchEvent(new Event('unread-count-changed'));
      }, 500);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-50 via-pink-50/30 to-white px-4 sm:px-6 pt-8 pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              {unreadThreads.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-rose-500 rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-rose-50">
                  {unreadThreads.length > 9 ? '9+' : unreadThreads.length}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Chat</h1>
              <p className="text-xs text-slate-400 font-medium">
                {unreadThreads.length > 0 ? `${unreadThreads.length} unread message${unreadThreads.length > 1 ? 's' : ''}` : 'You\'re all caught up!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-200/60" />
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 rounded bg-slate-200/60" />
                    <div className="w-full h-3 rounded bg-slate-200/60" />
                    <div className="w-20 h-3 rounded bg-slate-200/60" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : unreadThreads.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} className="text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-400 mb-1">No new messages</p>
            <p className="text-xs text-slate-300">When your teacher replies to your questions, they'll appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unreadThreads.map((thread) => {
              const lastMsg = getLastMessage(thread);
              const fromTeacher = lastMsg ? isTeacherMessage(lastMsg, thread) : false;
              return (
                <button
                  key={thread.id}
                  onClick={() => handleNotificationClick(thread)}
                  className="w-full text-left bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50 transition-all p-5 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors mt-0.5">
                      <MessageSquare size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-black text-slate-900 truncate">
                          {thread.lecture?.title || 'Lecture'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 flex-shrink-0 flex items-center gap-1">
                          <Clock size={10} />
                          {fmtRelative(thread.updated_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate leading-relaxed mb-2">
                        {lastMsg
                          ? `${fromTeacher ? 'Teacher replied' : 'You'}: "${lastMsg.message_text.substring(0, 80)}${lastMsg.message_text.length > 80 ? '...' : ''}"`
                          : `Your question: "${thread.question_text.substring(0, 80)}${thread.question_text.length > 80 ? '...' : ''}"`
                        }
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">New Reply</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentNotifications;
