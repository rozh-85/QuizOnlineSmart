import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

const Layout = ({ children, showFooter = false }: LayoutProps) => {
  

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Header - Modern Glassmorphism Style */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo matching Favicon */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                <span className="text-2xl font-black text-white">E</span>
              </div>
              <div>
                <span className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">EduPulse</span>
                <div className="text-[10px] font-bold text-primary-600 uppercase tracking-wider -mt-1">Chemistry</div>
              </div>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-8">
                <a 
                  href="#top" 
                  className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors relative group"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Home
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-purple-600 group-hover:w-full transition-all"></span>
                </a>
                <a 
                  href="#lectures" 
                  className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors relative group"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('lectures')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  Lectures
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-purple-600 group-hover:w-full transition-all"></span>
                </a>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Only shown on main page */}
      {showFooter && (
        <footer className="bg-white/80 backdrop-blur-xl border-t border-slate-200/50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
