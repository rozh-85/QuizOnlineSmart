import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Beaker } from 'lucide-react';
import { authService } from '../services/supabaseService';

const SplashScreen = ({ defaultMode = 'student' }: { defaultMode?: 'student' | 'teacher' }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Minimum view time for better UX
        const minTime = new Promise(resolve => setTimeout(resolve, 1500));
        
        const user = await authService.getCurrentUser();
        
        await minTime;

        if (user) {
          const profile = await authService.getProfile(user.id);
          if (profile?.role === 'teacher' || profile?.role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else {
          // If website should "lead to admin", go to admin login
          navigate(defaultMode === 'teacher' ? '/admin/login' : '/login', { replace: true });
        }
      } catch (error) {
        console.error('Session check failed:', error);
        navigate(defaultMode === 'teacher' ? '/admin/login' : '/login', { replace: true });
      }
    };

    checkSession();
  }, [navigate, defaultMode]);

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-[9999]">
      <div className="relative">
        {/* Animated Rings */}
        <div className="absolute -inset-8 bg-primary-500/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -inset-16 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        
        <div className="relative bg-gradient-to-br from-primary-500 to-purple-600 p-8 rounded-[2.5rem] shadow-2xl shadow-primary-500/20 animate-scale-in">
          <Beaker size={64} className="text-white animate-bounce-slow" />
        </div>
      </div>
      
      <div className="mt-12 text-center animate-fade-in-up">
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Smart Quiz</h2>
        <div className="flex items-center gap-1.5 justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '200ms' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '400ms' }}></div>
        </div>
      </div>

      <div className="absolute bottom-12 text-slate-500 text-sm font-bold tracking-widest uppercase">
        Initializing Canvas
      </div>
    </div>
  );
};

export default SplashScreen;
