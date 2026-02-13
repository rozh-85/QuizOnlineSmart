import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Menu, X, LogOut, Bell, Beaker, MessageSquare, Sparkles, Clock } from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import { authService, lectureQAService } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadThreads, setUnreadThreads] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { lectures, questions, getQuestionsByLecture } = useQuiz();

  useEffect(() => {
    fetchProfile();
  }, []);

  // Listen for unread-count-changed events from LectureQA when student reads a thread
  useEffect(() => {
    const handleCountChange = () => {
      if (profile?.id) fetchUnread(profile.id);
    };
    window.addEventListener('unread-count-changed', handleCountChange);
    return () => window.removeEventListener('unread-count-changed', handleCountChange);
  }, [profile]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }
      const profileData = await authService.getProfile(user.id);
      setProfile(profileData);
      // Fetch unread notifications
      fetchUnread(user.id);
      // Subscribe to real-time changes for this student's threads
      const sub = supabase
        .channel('student-notif-' + user.id)
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
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnread = async (userId: string) => {
    try {
      const [count, threads] = await Promise.all([
        lectureQAService.getStudentUnreadCount(userId),
        lectureQAService.getStudentUnreadThreads(userId)
      ]);
      console.log('[Student Notif] Unread count:', count, 'Threads:', threads.length);
      setUnreadCount(count);
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
    // Messages are ordered desc, so first is latest
    return teacherMsgs[0];
  };

  // Sort lectures by created_at desc for What's New
  const recentLectures = [...lectures].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  }).slice(0, 4);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
      });
      toast.success('Logged out');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 animate-fade-in">
      
      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-right flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white">
                  <Beaker size={18} />
                </div>
                <span className="font-black text-lg tracking-tight text-slate-900">EduPulse</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50">
                <X size={18} />
              </button>
            </div>

            {/* Student Info */}
            {profile && (
              <div className="p-6 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-black text-sm">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{profile.full_name}</div>
                    <div className="text-[10px] font-medium text-slate-400">Student</div>
                  </div>
                </div>
              </div>
            )}

            {/* Lecture List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-3">Lectures</div>
              <div className="space-y-1">
                {lectures.sort((a, b) => a.order - b.order).map((lecture) => (
                  <Link
                    key={lecture.id}
                    to={`/quiz?lectureId=${lecture.id}`}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      <BookOpen size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-700 truncate">{lecture.title}</div>
                      <div className="text-[10px] text-slate-400">{getQuestionsByLecture(lecture.id).length} Questions</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Logout */}
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-bold"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Header ── */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm">
                <Beaker size={16} />
              </div>
              <span className="font-black text-base tracking-tight text-slate-900">EduPulse</span>
            </div>
          </div>

          {/* Right: Bell + Logout */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors relative ${
                  showNotifications ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bell size={18} className={unreadCount > 0 ? 'animate-pulse' : ''} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-lg shadow-rose-200 border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-scale-in">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-primary-600" />
                      <span className="text-sm font-black text-slate-900 tracking-tight">Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{unreadCount} New</span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {unreadThreads.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Bell size={20} className="text-slate-300" />
                        </div>
                        <p className="text-xs font-bold text-slate-400">No new notifications</p>
                        <p className="text-[10px] text-slate-300 mt-1">You're all caught up!</p>
                      </div>
                    ) : (
                      unreadThreads.map((thread) => {
                        const lastMsg = getLastTeacherMessage(thread);
                        return (
                          <button
                            key={thread.id}
                            onClick={() => {
                              setShowNotifications(false);
                              // Immediately mark as read and update local state
                              lectureQAService.markAsRead(thread.id, true).catch(console.error);
                              setUnreadCount(prev => Math.max(0, prev - 1));
                              setUnreadThreads(prev => prev.filter(t => t.id !== thread.id));
                              navigate(`/lecture/${thread.lecture_id}?tab=qa&threadId=${thread.id}`);
                            }}
                            className="w-full px-5 py-4 flex items-start gap-3.5 hover:bg-primary-50/50 transition-colors text-left border-b border-slate-50 last:border-0 group"
                          >
                            <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors mt-0.5">
                              <MessageSquare size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-black text-slate-900 truncate">
                                  {thread.lecture?.title || 'Lecture'}
                                </span>
                                <span className="text-[9px] font-bold text-slate-300 flex-shrink-0">
                                  {fmtRelative(thread.updated_at)}
                                </span>
                              </div>
                              <p className="text-[11px] font-medium text-slate-500 truncate leading-relaxed">
                                {lastMsg
                                  ? `Teacher replied: "${lastMsg.message_text.substring(0, 50)}${lastMsg.message_text.length > 50 ? '...' : ''}"`
                                  : `Your question: "${thread.question_text.substring(0, 50)}${thread.question_text.length > 50 ? '...' : ''}"`
                                }
                              </p>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">New Reply</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Hero Section */}
        <div className="relative text-center py-10 sm:py-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg shadow-primary-100/50 border border-primary-100 mb-6">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <Beaker size={14} className="text-primary-600" />
            <span className="text-[11px] font-bold text-slate-700">Chemistry Learning Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-4 text-slate-900 tracking-tighter leading-[1.1]">
            Master Chemistry
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              One Lecture at a Time
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-lg mx-auto leading-relaxed mb-8">
            Interactive quizzes designed to help you understand chemistry concepts through structured learning and detailed feedback.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 max-w-md mx-auto">
            <div className="flex-1 bg-white rounded-2xl p-5 sm:p-6 shadow-lg shadow-slate-100/50 border border-slate-100">
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-primary-600 to-primary-700 bg-clip-text text-transparent">
                {lectures.length}
              </div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Lectures</div>
            </div>
            <div className="flex-1 bg-white rounded-2xl p-5 sm:p-6 shadow-lg shadow-slate-100/50 border border-slate-100">
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent">
                {questions.length}
              </div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Questions</div>
            </div>
          </div>
        </div>


        {/* ── Lectures Section ── */}
        <div className="pb-20 sm:pb-24">
          <div className="mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">Available Lectures</h2>
            <p className="text-slate-400 font-medium text-sm">Choose a module to start your learning journey</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-56 rounded-[2rem] bg-white/60 animate-pulse border border-slate-100" />
              ))
            ) : lectures.sort((a, b) => a.order - b.order).map((lecture) => {
              const questionCount = getQuestionsByLecture(lecture.id).length;

              return (
                <Link
                  key={lecture.id}
                  to={`/quiz?lectureId=${lecture.id}`}
                  className="group h-full"
                >
                  <div className="h-full bg-white border border-slate-100 hover:border-primary-200 transition-all p-6 sm:p-7 flex flex-col rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-primary-100/50 hover:-translate-y-1 duration-300">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg shadow-primary-200 group-hover:scale-110 transition-transform">
                        <BookOpen size={22} />
                      </div>
                      <div className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-black text-slate-500">{questionCount} Questions</span>
                      </div>
                    </div>

                    {/* Title + Description */}
                    <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight group-hover:text-primary-600 transition-colors uppercase leading-snug">
                      {lecture.title}
                    </h3>
                    <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed flex-1 line-clamp-2">
                      {lecture.description || 'Master this module through interactive questions.'}
                    </p>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-50 text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                      Start Session <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {lectures.length === 0 && !loading && (
            <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold text-sm">No lectures available yet.</p>
              <p className="text-slate-300 font-medium text-xs mt-1">Coming soon!</p>
            </div>
          )}
        </div>

        {/* ── What's New Section ── */}
        {recentLectures.length > 0 && (
          <div className="pb-16">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">What's New</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentLectures.map((lecture) => (
                <Link
                  key={'new-' + lecture.id}
                  to={`/quiz?lectureId=${lecture.id}`}
                  className="group flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100 hover:border-primary-200 hover:shadow-md transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <BookOpen size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-700 truncate group-hover:text-primary-600 transition-colors">{lecture.title}</div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 mt-0.5">
                      <Clock size={8} />
                      {fmtRelative(lecture.createdAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
