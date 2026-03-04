import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, Navigate } from 'react-router-dom';
import { Play, BookOpen, ArrowLeft, ArrowUp } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import MaterialsView from '../../components/MaterialsView';
import LectureQA from '../../components/LectureQA';
import { useQuiz } from '../../context/QuizContext';

const QuizStart = () => {
  const [searchParams] = useSearchParams();
  const lectureId = searchParams.get('lectureId');
  const sectionName = searchParams.get('section');
  const threadId = searchParams.get('threadId') || undefined;
  const qaSectionRef = useRef<HTMLDivElement>(null);
  const materialsSectionRef = useRef<HTMLDivElement>(null);
  const scrollTo = searchParams.get('scrollTo');
  const { getQuestionsByLecture, getLecture, getMaterialsByLecture } = useQuiz();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Track scroll position for mobile scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to Q&A chat section when coming from chat page
  useEffect(() => {
    if (threadId && qaSectionRef.current) {
      const timer = setTimeout(() => {
        qaSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [threadId]);

  // Auto-scroll to Learning Materials section when coming from What's New
  useEffect(() => {
    if (scrollTo === 'materials') {
      const timer = setTimeout(() => {
        const el = materialsSectionRef.current;
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - Math.max(80, window.innerHeight * 0.25);
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [scrollTo]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Redirect if no lecture selected
  if (!lectureId) {
    return <Navigate to="/dashboard" replace />;
  }

  const lecture = getLecture(lectureId);
  const questions = getQuestionsByLecture(lectureId).filter(q => q.isVisible !== false && (!sectionName || q.sectionId === sectionName));
  const materials = getMaterialsByLecture(lectureId, sectionName || undefined);

  // Redirect if lecture not found
  if (!lecture) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-24 sm:pt-6 sm:pb-20 animate-fade-in">
      <div className="flex flex-col gap-5">
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between">
          {sectionName ? (
            <Link to={`/quiz?lectureId=${lectureId}`}>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg text-slate-600 hover:text-primary-600 hover:bg-primary-50 transition-all border border-slate-200 bg-white">
                <ArrowLeft size={18} />
              </Button>
            </Link>
          ) : (
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg text-slate-600 hover:text-primary-600 hover:bg-primary-50 transition-all border border-slate-200 bg-white">
                <ArrowLeft size={18} />
              </Button>
            </Link>
          )}
          
          <span className="text-xs text-slate-400">
            {sectionName ? 'Topic Module' : 'Chapter Overview'}
          </span>
        </div>

        {/* Main Header Card */}
        <Card className="border border-slate-200 overflow-hidden rounded-xl bg-white">
          <div className="p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                  {sectionName ? `${sectionName}` : lecture.title}
                </h1>
                {sectionName && (
                  <div className="text-xs text-slate-500 mb-1">
                    Part of: <span className="text-primary-600 font-medium">{lecture.title}</span>
                  </div>
                )}
                {lecture.description && (
                  <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
                    {lecture.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 flex-shrink-0 w-full sm:w-auto">
              {/* Stats */}
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900 leading-none">
                    {sectionName ? questions.length : getQuestionsByLecture(lectureId).filter(q => q.isVisible !== false).length}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Questions</div>
                </div>
                <div className="w-px h-7 bg-slate-200" />
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900 leading-none">
                    ~{Math.ceil((sectionName ? questions.length : getQuestionsByLecture(lectureId).filter(q => q.isVisible !== false).length) * 0.5)}m
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Duration</div>
                </div>
              </div>

              {/* Primary Action Button */}
              <Link to={`/quiz/question?lectureId=${lectureId}${sectionName ? `&section=${encodeURIComponent(sectionName)}` : ''}`}>
                <Button size="lg" className="h-11 px-6 text-sm font-semibold rounded-lg shadow-sm">
                  <Play size={15} fill="currentColor" className="mr-1.5" />
                  Start Quiz
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Sections Grid */}
        {!sectionName && lecture.sections && lecture.sections.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 px-1">Sections</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lecture.sections.map((section, idx) => {
                const sectionQuestions = getQuestionsByLecture(lectureId).filter(q => q.isVisible !== false && q.sectionId === section);
                const sectionCount = sectionQuestions.length;
                
                return (
                  <Link 
                    key={idx} 
                    to={`/quiz?lectureId=${lectureId}&section=${encodeURIComponent(section)}`}
                  >
                    <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm transition-all flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800 leading-tight">{section}</div>
                          <div className="text-xs text-slate-400">{sectionCount} questions</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Learning Materials Section */}
        <div ref={materialsSectionRef}>
          <MaterialsView materials={materials} />
        </div>

        {/* Q&A Section */}
        <div ref={qaSectionRef}>
          <LectureQA lectureId={lectureId} initialThreadId={threadId} />
        </div>

        {/* Empty State */}
        {questions.length === 0 && !sectionName && (
          <div className="p-10 text-center rounded-xl border border-dashed border-slate-200 bg-white">
            <p className="text-sm text-slate-500">No questions found for this module.</p>
          </div>
        )}
      </div>

      {/* Floating Scroll to Top Button - Mobile Only */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="md:hidden fixed bottom-20 sm:bottom-6 right-6 h-11 w-11 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center z-40 animate-fade-in"
          aria-label="Scroll to top"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
};

export default QuizStart;
