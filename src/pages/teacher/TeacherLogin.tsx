import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Card, Input } from '../../components/ui';

const TeacherLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple prototype password check
    if (password === 'admin123') {
      localStorage.setItem('teacher_auth', 'true');
      toast.success('Administrative session authorized');
      navigate('/admin');
    } else {
      setError('Invalid Access Key');
      toast.error('Access Denied');
    }
  };

  return (
    <div className="max-w-md mx-auto pt-10 sm:pt-20 animate-fade-in">
      <Card className="p-8 sm:p-12 border-2 border-slate-100 shadow-xl shadow-slate-100/50">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teacher Access.</h1>
          <p className="text-slate-500 font-medium mt-2">Enter your secure key to proceed.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative group">
            <Input
              type="password"
              placeholder="Access Key"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="pl-12 h-14"
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={20} />
          </div>

          {error && (
            <div className="bg-error-50 border border-error-100 text-error-600 px-4 py-3 rounded-xl text-sm font-bold animate-shake">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full h-14 shadow-lg shadow-primary-200">
            Authorize Account
            <ArrowRight size={20} className="ml-2" />
          </Button>
        </form>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-300 mt-10">
          EduPulse Admin Terminal v1.0
        </p>
      </Card>
      
      <button 
        onClick={() => navigate('/')}
        className="mt-8 flex items-center gap-2 text-slate-400 hover:text-slate-600 mx-auto transition-colors text-xs font-bold uppercase tracking-widest"
      >
        Return to Learning
      </button>
    </div>
  );
};

export default TeacherLogin;
