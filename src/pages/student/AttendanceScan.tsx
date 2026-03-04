import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { attendanceApi } from '../../api/attendanceApi';

const AttendanceScan = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage(t('attendanceScan.noTokenProvided'));
        return;
      }

      try {
        const result = await attendanceApi.verifyAndJoin(token);
        if (result.success) {
          setStatus('success');
          setMessage(result.message || t('attendanceScan.recordedSuccessfully'));
        } else {
          setStatus('error');
          setMessage(result.error || t('attendanceScan.failedToRecord'));
        }
      } catch (e: any) {
        setStatus('error');
        setMessage(e.message || t('attendanceScan.failedToVerify'));
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
          {status === 'loading' ? t('attendanceScan.verifying') :
           status === 'success' ? t('attendanceScan.attendanceConfirmed') :
           t('attendanceScan.attendanceFailed')}
        </h1>

        <p className={`text-sm mb-6 ${
          status === 'success' ? 'text-emerald-600' :
          status === 'error' ? 'text-rose-500' :
          'text-slate-500'
        }`}>
          {message || t('attendanceScan.checkingToken')}
        </p>

        <div className="flex items-center justify-center gap-1.5 text-slate-300 text-xs">
          <QrCode size={13} />
          <span>{t('attendanceScan.eduPulseAttendance')}</span>
        </div>

        {status !== 'loading' && (
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 w-full py-3 bg-primary-600 text-white font-semibold rounded-lg text-sm transition-all active:scale-95 hover:bg-primary-700"
          >
            {t('attendanceScan.goToDashboard')}
          </button>
        )}
      </div>
    </div>
  );
};

export default AttendanceScan;
