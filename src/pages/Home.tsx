import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Beaker } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

const Home = () => {
  const { questions, lectures, getQuestionsByLecture } = useQuiz();

  return (
    <div className="flex flex-col animate-fade-in">
      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-to-br from-primary-50 via-white to-purple-50 overflow-hidden min-h-[60vh] flex items-center">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative text-center py-12 sm:py-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg shadow-primary-100/50 border border-primary-100 mb-8 animate-slide-up">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <Beaker size={16} className="text-primary-600" />
            <span className="text-xs font-bold text-slate-700">Chemistry Learning Platform</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black mb-6 text-slate-900 tracking-tighter leading-[1.05] animate-slide-up" style={{ animationDelay: '100ms' }}>
            Master Chemistry
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              One Lecture at a Time
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-12 font-medium max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '200ms' }}>
            Interactive quizzes designed to help you understand chemistry concepts through structured learning and detailed feedback.
          </p>

          {/* Stats Cards */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex-1 min-w-[160px] bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 transition-transform hover:-translate-y-1">
              <div className="text-5xl font-black bg-gradient-to-br from-primary-600 to-primary-700 bg-clip-text text-transparent mb-2">
                {lectures.length}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lectures</div>
            </div>
            <div className="flex-1 min-w-[160px] bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 transition-transform hover:-translate-y-1">
              <div className="text-5xl font-black bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
                {questions.length}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Questions</div>
            </div>
            <div className="flex-1 min-w-[160px] bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 transition-transform hover:-translate-y-1">
              <div className="text-5xl font-black bg-gradient-to-br from-emerald-600 to-emerald-700 bg-clip-text text-transparent mb-2">
                100%
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lectures Grid */}
      <div id="lectures" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 scroll-mt-20">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Available Lectures</h2>
            <p className="text-slate-500 font-medium text-lg">Choose a module to start your learning journey</p>
          </div>
          <div className="h-1 w-24 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full hidden sm:block"></div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {lectures.sort((a, b) => a.order - b.order).map((lecture) => {
            const questionCount = getQuestionsByLecture(lecture.id).length;
            
            return (
              <Link 
                key={lecture.id} 
                to={`/quiz?lectureId=${lecture.id}`}
                className="group h-full"
              >
                <div className="h-full bg-white border border-slate-100 hover:border-primary-200 transition-all p-8 flex flex-col rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-primary-100/50 hover:-translate-y-2">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg shadow-primary-200 group-hover:scale-110 transition-transform">
                      <BookOpen size={28} />
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                      <span className="text-xs font-black text-slate-500">{questionCount} Questions</span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-primary-600 transition-colors uppercase">{lecture.title}</h3>
                  <p className="text-slate-500 text-base font-medium mb-8 leading-relaxed flex-1">
                    {lecture.description}
                  </p>
                  
                  <div className="pt-6 border-t border-slate-50 text-[11px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                    Start Session <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {lectures.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BookOpen size={40} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-black text-xl">No lectures available yet.</p>
            <p className="text-slate-300 font-medium">Coming soon! Stay tuned for more chemistry content.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
