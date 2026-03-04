import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, QrCode } from 'lucide-react';
import { attendanceApi } from '../../api/attendanceApi';

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
        const result = await attendanceApi.verifyAndJoin(token);
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-sm w-full text-center">
        <div className="flex justify-center mb-4">
          {status === 'loading' && (
            <Loader2 className="animate-spin text-primary-600" size={32} />
          )}
          {status === 'success' && (
            <CheckCircle className="text-emerald-500" size={36} />
          )}
          {status === 'error' && (
            <XCircle className="text-rose-500" size={36} />
          )}
        </div>

        <h1 className="text-lg font-bold text-slate-900 mb-1">
          {status === 'loading' ? 'Verifying...' :
           status === 'success' ? 'Attendance Confirmed' :
           'Attendance Failed'}
        </h1>

        <p className={`text-sm mb-6 ${
          status === 'success' ? 'text-emerald-600' :
          status === 'error' ? 'text-rose-500' :
          'text-slate-500'
        }`}>
          {message || 'Checking your attendance token...'}
        </p>

        <div className="flex items-center justify-center gap-1.5 text-slate-300 text-xs">
          <QrCode size={13} />
          <span>EduPulse Attendance</span>
        </div>

        {status !== 'loading' && (
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 w-full py-3 bg-primary-600 text-white font-semibold rounded-lg text-sm transition-all active:scale-95 hover:bg-primary-700"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default AttendanceScan;
