import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Beaker } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

const Home = () => {
  const { questions, lectures, getQuestionsByLecture } = useQuiz();

  return (
    <div className="flex flex-col animate-fade-in">
      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-to-br from-primary-50 via-white to-purple-50 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative text-center py-16 sm:py-24 w-full max-w-4xl mx-auto px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg shadow-primary-100/50 border border-primary-100 mb-8">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <Beaker size={16} className="text-primary-600" />
            <span className="text-xs font-bold text-slate-700">Chemistry Learning Platform</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 text-slate-900 tracking-tighter leading-[1.1]">
            Master Chemistry
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              One Lecture at a Time
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-10 font-medium max-w-2xl mx-auto">
            Interactive quizzes designed to help you understand chemistry concepts through structured learning.
          </p>

          {/* Stats Cards */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 max-w-2xl mx-auto">
            <div className="flex-1 min-w-[140px] bg-white rounded-2xl p-6 shadow-lg shadow-slate-100 border border-slate-100">
              <div className="text-4xl font-black bg-gradient-to-br from-primary-600 to-primary-700 bg-clip-text text-transparent mb-2">
                {lectures.length}
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lectures</div>
            </div>
            <div className="flex-1 min-w-[140px] bg-white rounded-2xl p-6 shadow-lg shadow-slate-100 border border-slate-100">
              <div className="text-4xl font-black bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
                {questions.length}
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Questions</div>
            </div>
            <div className="flex-1 min-w-[140px] bg-white rounded-2xl p-6 shadow-lg shadow-slate-100 border border-slate-100">
              <div className="text-4xl font-black bg-gradient-to-br from-emerald-600 to-emerald-700 bg-clip-text text-transparent mb-2">
                100%
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lectures Grid */}
      <div id="lectures" className="w-full max-w-6xl mx-auto px-4 py-12 sm:py-16 scroll-mt-20">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Available Lectures</h2>
          <p className="text-slate-500 font-medium">Choose a lecture to start your quiz</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lectures.sort((a, b) => a.order - b.order).map((lecture) => {
            const questionCount = getQuestionsByLecture(lecture.id).length;
            
            return (
              <Link 
                key={lecture.id} 
                to={`/quiz?lectureId=${lecture.id}`}
                className="group"
              >
                <div className="h-full bg-white border-2 border-slate-100 hover:border-primary-600 transition-all p-6 flex flex-col rounded-3xl group-hover:shadow-xl group-hover:shadow-primary-100/50 group-hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg shadow-primary-200">
                      <BookOpen size={24} />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
                      <span className="text-xs font-black text-slate-600">{questionCount} Questions</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{lecture.title}</h3>
                  <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed flex-1">
                    {lecture.description}
                  </p>
                  
                  <div className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                    Start Learning <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {lectures.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-semibold">No lectures available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
