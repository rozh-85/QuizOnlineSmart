import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, QrCode } from 'lucide-react';
import { attendanceService } from '../../services/supabaseService';

const AttendanceScan = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No attendance token provided');
        return;
      }

      try {
        const result = await attendanceService.verifyAndJoin(token);
        if (result.success) {
          setStatus('success');
          setMessage(result.message || 'Attendance recorded successfully!');
        } else {
          setStatus('error');
          setMessage(result.error || 'Failed to record attendance');
        }
      } catch (e: any) {
        setStatus('error');
        setMessage(e.message || 'Failed to verify attendance. Please try again.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-sm w-full text-center">
        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center">
              <Loader2 className="animate-spin text-primary-600" size={32} />
            </div>
          )}
          {status === 'success' && (
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <CheckCircle className="text-emerald-600" size={32} />
            </div>
          )}
          {status === 'error' && (
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center">
              <XCircle className="text-rose-600" size={32} />
            </div>
          )}
        </div>

        <h1 className="text-xl font-black text-slate-900 tracking-tight mb-2">
          {status === 'loading' ? 'Verifying...' :
           status === 'success' ? 'Attendance Confirmed' :
           'Attendance Failed'}
        </h1>

        <p className={`text-sm font-medium mb-6 ${
          status === 'success' ? 'text-emerald-600' :
          status === 'error' ? 'text-rose-500' :
          'text-slate-400'
        }`}>
          {message || 'Checking your attendance token...'}
        </p>

        <div className="flex items-center justify-center gap-2 text-slate-300 text-xs font-medium">
          <QrCode size={14} />
          <span>Smart Quiz Attendance</span>
        </div>

        {status !== 'loading' && (
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-sm transition-all active:scale-95 hover:bg-slate-800"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default AttendanceScan;
