import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Clock, ChevronRight } from 'lucide-react';
import { authService, lectureQAService } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';

const StudentNotifications = () => {
  const [unreadThreads, setUnreadThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) { navigate('/login', { replace: true }); return; }
      await fetchUnread(user.id);

      // Subscribe to real-time
      const sub = supabase
        .channel('student-notif-page-' + user.id)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'lecture_questions',
          filter: `student_id=eq.${user.id}`
        }, () => fetchUnread(user.id))
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'lecture_question_messages'
        }, () => fetchUnread(user.id))
        .subscribe();

      return () => { sub.unsubscribe(); };
    } catch (e) {
      console.error('Notifications fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnread = async (userId: string) => {
    try {
      const threads = await lectureQAService.getStudentUnreadThreads(userId);
      setUnreadThreads(threads);
    } catch (e) {
      console.error('Error fetching unread:', e);
    }
  };

  const fmtRelative = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getLastTeacherMessage = (thread: any) => {
    if (!thread.messages || thread.messages.length === 0) return null;
    const teacherMsgs = thread.messages.filter((m: any) => {
      const role = m.sender?.role || m.profiles?.role;
      return role === 'teacher' || role === 'admin';
    });
    if (teacherMsgs.length === 0) return null;
    return teacherMsgs[0];
  };

  const handleNotificationClick = async (thread: any) => {
    try {
      await lectureQAService.markAsRead(thread.id, true);
      setUnreadThreads(prev => prev.filter(t => t.id !== thread.id));
      window.dispatchEvent(new Event('unread-count-changed'));
    } catch { /* ignore */ }
    navigate(`/lecture/${thread.lecture_id}?tab=qa&threadId=${thread.id}`);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-50 via-pink-50/30 to-white px-4 sm:px-6 pt-8 pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Bell size={20} />
              </div>
              {unreadThreads.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-rose-500 rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-rose-50">
                  {unreadThreads.length > 9 ? '9+' : unreadThreads.length}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
              <p className="text-xs text-slate-400 font-medium">
                {unreadThreads.length > 0 ? `${unreadThreads.length} unread notification${unreadThreads.length > 1 ? 's' : ''}` : 'You\'re all caught up!'}
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
              <Bell size={28} className="text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-400 mb-1">No new notifications</p>
            <p className="text-xs text-slate-300">When your teacher replies to your questions, they'll appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unreadThreads.map((thread) => {
              const lastMsg = getLastTeacherMessage(thread);
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
                          ? `Teacher replied: "${lastMsg.message_text.substring(0, 80)}${lastMsg.message_text.length > 80 ? '...' : ''}"`
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
