import { useState, useEffect } from 'react';
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Redirect if no lecture selected
  if (!lectureId) {
    return <Navigate to="/dashboard" replace />;
  }

  const lecture = getLecture(lectureId);
  const questions = getQuestionsByLecture(lectureId).filter(q => !sectionName || q.sectionId === sectionName);
  const materials = getMaterialsByLecture(lectureId, sectionName || undefined);

  // Redirect if lecture not found
  if (!lecture) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-4 pb-12 sm:pt-6 sm:pb-20 animate-fade-in">
      <div className="flex flex-col gap-6">
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between px-1">
          {sectionName ? (
            <Link to={`/quiz?lectureId=${lectureId}`}>
              <Button variant="ghost" size="sm" className="h-11 w-11 p-0 rounded-full text-slate-900 hover:text-primary-600 hover:bg-primary-50 transition-all group border border-slate-200 shadow-sm bg-white">
                <ArrowLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          ) : (
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="h-11 w-11 p-0 rounded-full text-slate-900 hover:text-primary-600 hover:bg-primary-50 transition-all group border border-slate-200 shadow-sm bg-white">
                <ArrowLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          )}
          
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
            {sectionName ? 'Topic Module' : 'Chapter Overview'}
          </div>
        </div>

        {/* Main Header Card - Simple & Clean */}
        <Card className="border border-slate-200 shadow-sm overflow-hidden rounded-2xl bg-white">
          <div className="p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left flex-1">
              <div className="w-14 h-14 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
                <BookOpen size={24} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                  {sectionName ? `${sectionName}` : lecture.title}
                </h1>
                {sectionName && (
                  <div className="text-xs font-semibold text-slate-400 mb-2">
                    Part of: <span className="text-primary-600 uppercase tracking-tight">{lecture.title}</span>
                  </div>
                )}
                <p className="text-sm text-slate-500 font-medium max-w-xl leading-relaxed">
                  {lecture.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 lg:gap-12 flex-shrink-0">
              {/* Stats */}
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-900 leading-none">
                    {sectionName ? questions.length : getQuestionsByLecture(lectureId).length}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Questions</div>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-900 leading-none">
                    ~{Math.ceil((sectionName ? questions.length : getQuestionsByLecture(lectureId).length) * 0.5)}m
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Duration</div>
                </div>
              </div>

              {/* Primary Action Button */}
              <Link to={`/quiz/question?lectureId=${lectureId}${sectionName ? `&section=${encodeURIComponent(sectionName)}` : ''}`}>
                <Button size="lg" className="h-12 px-8 text-sm font-bold rounded-xl shadow-md transition-all uppercase tracking-wider bg-slate-900 hover:bg-primary-600">
                  <Play size={16} fill="currentColor" className="mr-2" />
                  Start {sectionName ? 'Section' : 'Chapter'} Quiz
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Sections Grid - Simple & Balanced */}
        {!sectionName && lecture.sections && lecture.sections.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Sections</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lecture.sections.map((section, idx) => {
                const sectionQuestions = getQuestionsByLecture(lectureId).filter(q => q.sectionId === section);
                const sectionCount = sectionQuestions.length;
                
                return (
                  <Link 
                    key={idx} 
                    to={`/quiz?lectureId=${lectureId}&section=${encodeURIComponent(section)}`}
                  >
                    <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-primary-400 hover:shadow-md transition-all flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
                          <BookOpen size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-700 leading-tight mb-0.5">{section}</div>
                          <div className="text-[10px] font-medium text-slate-400">Topic Module</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg">
                        {sectionCount} Q
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Learning Materials Section */}
        <MaterialsView materials={materials} />

        {/* Q&A Section */}
        <LectureQA lectureId={lectureId} />

        {/* Empty State */}
        {questions.length === 0 && !sectionName && (
          <div className="p-12 text-center rounded-[2rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold mb-4">No questions found for this module.</p>
          </div>
        )}
      </div>

      {/* Floating Scroll to Top Button - Mobile Only */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="md:hidden fixed bottom-6 right-6 h-12 w-12 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-all duration-300 flex items-center justify-center z-50 animate-fade-in"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

export default QuizStart;
