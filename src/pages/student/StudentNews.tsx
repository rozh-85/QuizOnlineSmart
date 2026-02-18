import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Clock, ArrowRight, Search } from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import { authService } from '../../services/supabaseService';

const StudentNews = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { lectures } = useQuiz();

  useEffect(() => {
    const init = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) { navigate('/login', { replace: true }); return; }
      } catch { /* ignore */ }
    };
    init();
  }, []);

  const fmtRelative = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const fmtDate = (d: string) => {
    return new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const recentLectures = [...lectures]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .filter(l => !search || l.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-white px-4 sm:px-6 pt-8 pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">What's New</h1>
              <p className="text-xs text-slate-400 font-medium">Latest lectures and updates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-4">
        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search lectures..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all shadow-sm"
          />
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {recentLectures.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={24} className="text-amber-300" />
              </div>
              <p className="text-slate-400 font-bold text-sm">No new lectures yet</p>
              <p className="text-slate-300 text-xs mt-1">Check back soon!</p>
            </div>
          ) : (
            recentLectures.map((lecture, idx) => (
              <Link
                key={lecture.id}
                to={`/quiz?lectureId=${lecture.id}`}
                className="group block bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50 transition-all p-5 sm:p-6"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <BookOpen size={20} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {idx === 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-wider rounded-md">Latest</span>
                      )}
                      <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                        <Clock size={10} />
                        {fmtRelative(lecture.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors mb-1 truncate">
                      {lecture.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">
                      {lecture.description || 'A new lecture has been added to the course.'}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-[10px] font-black text-primary-600 uppercase tracking-wider group-hover:gap-3 transition-all">
                      Start Learning <ArrowRight size={12} />
                    </div>
                  </div>
                </div>

                {/* Date footer */}
                <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-300">
                  Added {fmtDate(lecture.createdAt)}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentNews;
