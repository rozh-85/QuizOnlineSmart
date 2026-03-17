import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuiz } from '../../context/QuizContext';
import { authApi } from '../../api/authApi';
import HeroBanner from '../../components/student/HeroBanner';
import StatsRow from '../../components/student/StatsRow';
import LectureGrid from '../../components/student/LectureGrid';

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

  const visibleQuestionCount = useMemo(
    () => questions.filter(q => q.isVisible !== false).length,
    [questions]
  );

  const sectionCount = useMemo(
    () => lectures.reduce((sum, l) => sum + (l.sections?.length ?? 0), 0),
    [lectures]
  );

  const firstName = profile?.full_name
    ? profile.full_name.trim().split(/\s+/)[0]
    : '';

  return (
    <div className="animate-fade-in">
      <HeroBanner
        name={firstName}
        greeting={greeting()}
        lectureCount={lectures.length}
      />

      <StatsRow
        lectureCount={lectures.length}
        questionCount={visibleQuestionCount}
        sectionCount={sectionCount}
      />

      <LectureGrid
        lectures={lectures}
        getQuestionsByLecture={getQuestionsByLecture}
        highlightId={highlightId}
        cardRefs={cardRefs}
      />
    </div>
  );
};

export default StudentDashboard;
