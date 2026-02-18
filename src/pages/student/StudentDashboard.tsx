import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Beaker, Play } from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import { authService } from '../../services/supabaseService';

const StudentDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { lectures, questions, getQuestionsByLecture } = useQuiz();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }
      const profileData = await authService.getProfile(user.id);
      setProfile(profileData);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="animate-fade-in">
      {/* Hero / Greeting */}
      <div className="bg-gradient-to-br from-primary-50 via-white to-purple-50/30 px-4 sm:px-6 pt-6 sm:pt-10 pb-8 sm:pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Greeting */}
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-primary-100/50 mb-4">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <Beaker size={12} className="text-primary-600" />
              <span className="text-[10px] font-bold text-slate-500">EduPulse Chemistry</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-tight mb-2">
              {greeting()}{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-sm text-slate-400 font-medium max-w-md">
              Continue your chemistry learning journey. Pick a lecture to get started.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-1 max-w-[160px] bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-primary-600 to-primary-700 bg-clip-text text-transparent leading-none">
                {lectures.length}
              </div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Lectures</div>
            </div>
            <div className="flex-1 max-w-[160px] bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent leading-none">
                {questions.filter(q => q.isVisible !== false).length}
              </div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Questions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lectures Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8" id="lectures-section">
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Available Lectures</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Choose a module to start</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {lectures.sort((a, b) => a.order - b.order).map((lecture) => {
            const questionCount = getQuestionsByLecture(lecture.id).filter(q => q.isVisible !== false).length;

            return (
              <Link
                key={lecture.id}
                to={`/quiz?lectureId=${lecture.id}`}
                className="group"
              >
                <div className="h-full bg-white border border-slate-100 hover:border-primary-200 transition-all p-5 sm:p-6 flex flex-col rounded-2xl shadow-sm hover:shadow-xl hover:shadow-primary-100/50 hover:-translate-y-0.5 duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-200 group-hover:scale-105 transition-transform">
                      <BookOpen size={18} />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-500">
                      {questionCount} Q
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 mb-1.5 tracking-tight group-hover:text-primary-600 transition-colors uppercase leading-snug line-clamp-2">
                    {lecture.title}
                  </h3>
                  <p className="text-slate-400 text-xs font-medium mb-4 leading-relaxed flex-1 line-clamp-2">
                    {lecture.description || 'Master this module through interactive questions.'}
                  </p>

                  <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Start <ArrowRight size={12} />
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all">
                      <Play size={12} fill="currentColor" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {lectures.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold text-sm">No lectures available yet.</p>
            <p className="text-slate-300 font-medium text-xs mt-1">Coming soon!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
