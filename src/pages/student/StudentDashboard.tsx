import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { BookOpen, ArrowRight, Beaker } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuiz } from '../../context/QuizContext';
import { authApi } from '../../api/authApi';

const StudentDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { lectures, questions, getQuestionsByLecture } = useQuiz();

  // Scroll to & highlight the lecture card coming from What's New
  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => {
      const el = cardRefs.current[highlightId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
    // Clear the param after 4 seconds so the animation doesn't persist on revisit
    const cleanup = setTimeout(() => {
      setSearchParams({}, { replace: true });
    }, 4000);
    return () => { clearTimeout(timer); clearTimeout(cleanup); };
  }, [highlightId, setSearchParams]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = await authApi.getCurrentUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }
      const profileData = await authApi.getProfile(user.id);
      setProfile(profileData);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  return (
    <div className="animate-fade-in">
      {/* Hero / Greeting */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 pt-6 sm:pt-8 pb-6 sm:pb-8">
        <div className="max-w-5xl xl:max-w-6xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
            {greeting()}{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-slate-500">
            {t('student.pickLecture')}
          </p>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 mt-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                <BookOpen size={16} />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 leading-none">{lectures.length}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t('stats.lectures')}</div>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <Beaker size={16} />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 leading-none">{questions.filter(q => q.isVisible !== false).length}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t('stats.questions')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lectures Grid */}
      <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8" id="lectures-section">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-base font-semibold text-slate-900">{t('student.availableLectures')}</h2>
          <span className="text-xs text-slate-400">{lectures.length} {t('stats.modules')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {lectures.sort((a, b) => a.order - b.order).map((lecture) => {
            const questionCount = getQuestionsByLecture(lecture.id).filter(q => q.isVisible !== false).length;

            const isHighlighted = highlightId === lecture.id;

            return (
              <Link
                key={lecture.id}
                to={`/quiz?lectureId=${lecture.id}`}
                className="group"
              >
                <div
                  ref={el => { cardRefs.current[lecture.id] = el; }}
                  className={`h-full bg-white border border-slate-200 hover:border-primary-300 transition-all p-5 flex flex-col rounded-xl hover:shadow-md duration-200 ${
                    isHighlighted ? 'animate-pulse-border' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      <BookOpen size={18} />
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                      {t('student.questionsCount', { count: questionCount })}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors leading-snug line-clamp-2">
                    {lecture.title}
                  </h3>
                  <p className="text-slate-500 text-xs mb-4 leading-relaxed flex-1 line-clamp-2">
                    {lecture.description || t('student.masterModule')}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-primary-600 flex items-center gap-1.5 group-hover:gap-2 transition-all">
                      {t('student.startQuiz')} <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {lectures.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <BookOpen size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-sm">{t('student.noLectures')}</p>
            <p className="text-slate-400 text-xs mt-1">{t('student.checkBackSoon')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
