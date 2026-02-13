import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Beaker } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

const Home = () => {
  const { questions, lectures, getQuestionsByLecture } = useQuiz();

  return (
    <div className="flex flex-col animate-fade-in">
      {/* Hero Section — Clean & Compact */}
      <div className="relative bg-gradient-to-br from-primary-50 via-white to-purple-50 overflow-hidden">
        {/* Subtle decorative blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-100 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative text-center py-14 sm:py-20 w-full max-w-5xl mx-auto px-4 sm:px-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-md shadow-primary-100/30 border border-primary-100 mb-6 animate-slide-up">
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div>
            <Beaker size={13} className="text-primary-600" />
            <span className="text-[11px] font-bold text-slate-600">Chemistry Learning Platform</span>
          </div>
          
          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 text-slate-900 tracking-tighter leading-[1.1] animate-slide-up">
            Master Chemistry
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              One Lecture at a Time
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed mb-10 font-medium max-w-lg mx-auto animate-slide-up">
            Interactive quizzes designed to help you understand chemistry concepts through structured learning and detailed feedback.
          </p>

          {/* Stats — Compact Row */}
          <div className="flex items-center justify-center gap-4 max-w-md mx-auto animate-slide-up">
            <div className="flex-1 bg-white rounded-2xl p-5 shadow-lg shadow-slate-100/50 border border-slate-100">
              <div className="text-3xl font-black bg-gradient-to-br from-primary-600 to-primary-700 bg-clip-text text-transparent">
                {lectures.length}
              </div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lectures</div>
            </div>
            <div className="flex-1 bg-white rounded-2xl p-5 shadow-lg shadow-slate-100/50 border border-slate-100">
              <div className="text-3xl font-black bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent">
                {questions.length}
              </div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Questions</div>
            </div>
            <div className="flex-1 bg-white rounded-2xl p-5 shadow-lg shadow-slate-100/50 border border-slate-100">
              <div className="text-3xl font-black bg-gradient-to-br from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                100%
              </div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lectures Grid */}
      <div id="lectures" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 scroll-mt-20">
        <div className="mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">Available Lectures</h2>
          <p className="text-slate-400 font-medium text-sm">Choose a module to start your learning journey</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {lectures.sort((a, b) => a.order - b.order).map((lecture) => {
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
                  
                  <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight group-hover:text-primary-600 transition-colors uppercase leading-snug">
                    {lecture.title}
                  </h3>
                  <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed flex-1 line-clamp-2">
                    {lecture.description || 'Master this module through interactive questions.'}
                  </p>
                  
                  <div className="pt-4 border-t border-slate-50 text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                    Start Session <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {lectures.length === 0 && (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold text-sm">No lectures available yet.</p>
            <p className="text-slate-300 font-medium text-xs mt-1">Coming soon!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
