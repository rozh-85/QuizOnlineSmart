import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, ChevronRight, Home as HomeIcon, Bell } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

const Layout = ({ children, showFooter = false }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { lectures } = useQuiz();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLectureClick = (lectureId: string) => {
    setIsSidebarOpen(false);
    navigate(`/quiz?lectureId=${lectureId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Header - Modern Glassmorphism Style */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/50 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-24">
            {/* Left Side: Hamburger & Logo */}
            <div className="flex items-center gap-4">
              <div className="sm:hidden flex items-center">
                <button
                  onClick={toggleSidebar}
                  className="p-2 -ml-2 text-slate-600 hover:text-primary-600 focus:outline-none transition-colors"
                  aria-label="Open sidebar"
                >
                  <Menu size={28} />
                </button>
              </div>

              <Link to="/" className="hidden sm:flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg group-hover:shadow-primary-200 transition-all">
                  <span className="text-3xl font-black text-white">E</span>
                </div>
                <div>
                  <span className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tighter">EduPulse</span>
                  <div className="text-[11px] font-bold text-primary-600 uppercase tracking-[0.2em] -mt-1">Chemistry</div>
                </div>
              </Link>
            </div>

            {/* Right Side: Desktop Nav & Notification Icon */}
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-8">
                <Link 
                  to="/"
                  className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors relative group"
                >
                  Home
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-purple-600 group-hover:w-full transition-all"></span>
                </Link>
                <a 
                  href="#lectures" 
                  className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors relative group"
                  onClick={(e) => {
                    const isHomePage = window.location.hash === '#/' || window.location.hash === '';
                    if (!isHomePage) {
                       navigate('/');
                       setTimeout(() => {
                         document.getElementById('lectures')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                       }, 100);
                    } else {
                      e.preventDefault();
                      document.getElementById('lectures')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  Lectures
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-purple-600 group-hover:w-full transition-all"></span>
                </a>
              </nav>

              {/* Mobile Notification Icon - Far Right (Visual Only) */}
              <div className="sm:hidden flex items-center">
                <div 
                  className="p-2 -mr-2 text-slate-400 opacity-50 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 sm:hidden transition-opacity animate-fade-in"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-white z-[60] sm:hidden transform transition-transform duration-300 ease-out shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-black text-lg">
                E
              </div>
              <span className="font-black text-slate-900 tracking-tight">EduPulse</span>
            </div>
            <button onClick={toggleSidebar} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Main</p>
              <Link 
                to="/" 
                onClick={toggleSidebar}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-primary-600 font-bold transition-all"
              >
                <HomeIcon size={20} />
                <span>Home</span>
              </Link>
            </div>

            <div className="space-y-1">
              <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Available Lectures</p>
              {lectures.length > 0 ? (
                lectures.sort((a, b) => a.order - b.order).map((lecture) => (
                  <button
                    key={lecture.id}
                    onClick={() => handleLectureClick(lecture.id)}
                    className="w-full flex items-center justify-between px-3 py-4 rounded-xl hover:bg-primary-50 text-slate-700 hover:text-primary-700 font-bold transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary-100 flex items-center justify-center text-slate-500 group-hover:text-primary-600 transition-colors">
                        <BookOpen size={16} />
                      </div>
                      <span className="text-sm text-left line-clamp-1">{lecture.title}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-400" />
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-xs font-semibold text-slate-400 italic">
                  No lectures available
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold text-center">
              © 2026 EduPulse Chemistry
            </p>
          </div>
        </div>
      </aside>


      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Only shown on main page */}
      {showFooter && (
        <footer className="bg-white/80 backdrop-blur-xl border-t border-slate-200/50 py-10">
          <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <span className="text-sm font-black text-white">E</span>
                </div>
                <span className="text-sm font-bold text-slate-700">EduPulse Chemistry</span>
              </div>
              <p className="text-center text-slate-500 text-sm font-medium">
                © 2026 EduPulse. Master chemistry one lecture at a time.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;

