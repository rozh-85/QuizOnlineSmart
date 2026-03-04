import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/authApi';
import { lectureQAApi } from '../../api/lectureQAApi';
import { subscribeToStudentQuestions } from '../../services/realtimeService';

const StudentNotifications = () => {
  const [unreadThreads, setUnreadThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
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

    let pollInterval: ReturnType<typeof setInterval> | null = null;

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

        // 3-second polling fallback in case realtime misses an event
        pollInterval = setInterval(() => {
          if (mounted) fetchUnread(user.id);
        }, 3000);
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
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [navigate, fetchUnread]);

  const fmtRelative = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60) return t('time.justNow');
    if (diff < 3600) return t('time.minutesAgo', { count: Math.floor(diff / 60) });
    if (diff < 86400) return t('time.hoursAgo', { count: Math.floor(diff / 3600) });
    if (diff < 604800) return t('time.daysAgo', { count: Math.floor(diff / 86400) });
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
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 pt-6 pb-5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                <MessageSquare size={18} />
              </div>
              {unreadThreads.length > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[16px] h-[16px] px-1 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadThreads.length > 9 ? '9+' : unreadThreads.length}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{t('chat.title')}</h1>
              <p className="text-sm text-slate-500">
                {unreadThreads.length > 0 ? t(unreadThreads.length > 1 ? 'chat.unreadMessages_plural' : 'chat.unreadMessages', { count: unreadThreads.length }) : t('chat.allCaughtUp')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 rounded bg-slate-200" />
                    <div className="w-full h-3 rounded bg-slate-200" />
                    <div className="w-20 h-3 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : unreadThreads.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-xl border border-slate-200">
            <MessageSquare size={28} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500 mb-1">{t('chat.noNewMessages')}</p>
            <p className="text-xs text-slate-400">{t('chat.teacherRepliesAppear')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {unreadThreads.map((thread) => {
              const lastMsg = getLastMessage(thread);
              const fromTeacher = lastMsg ? isTeacherMessage(lastMsg, thread) : false;
              return (
                <button
                  key={thread.id}
                  onClick={() => handleNotificationClick(thread)}
                  className="w-full text-start bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-sm transition-all p-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      <MessageSquare size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {thread.lecture?.title || 'Lecture'}
                        </span>
                        <span className="text-xs text-slate-400 flex-shrink-0 flex items-center gap-1">
                          <Clock size={11} />
                          {fmtRelative(thread.updated_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate leading-relaxed mb-2">
                        {lastMsg
                          ? `${fromTeacher ? t('chat.teacherReplied') : t('chat.you')}: "${lastMsg.message_text.substring(0, 80)}${lastMsg.message_text.length > 80 ? '...' : ''}"`
                          : `${t('chat.yourQuestion')}: "${thread.question_text.substring(0, 80)}${thread.question_text.length > 80 ? '...' : ''}"`
                        }
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                          <span className="text-xs font-medium text-primary-600">{t('chat.newReply')}</span>
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
