import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Camera, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import { attendanceApi } from '../../api/attendanceApi';

const StudentQRScan = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    setStatus('scanning');
    setMessage('');
    setScanning(true);

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          // Stop scanning immediately
          await stopScanner();
          handleScanResult(decodedText);
        },
        () => { /* ignore scan failures */ }
      );
    } catch (err: any) {
      console.error('Scanner error:', err);
      setStatus('error');
      setMessage(err?.message || t('qrScan.cameraPermission'));
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch { /* ignore */ }
    setScanning(false);
  };

  const handleScanResult = async (text: string) => {
    setStatus('processing');
    setMessage(t('qrScan.verifyingAttendance'));

    try {
      // Extract token from URL - handle both full URLs and raw tokens
      let token = text;
      
      // If it's a URL like https://domain/#/attend/TOKEN or #/attend/TOKEN
      const attendMatch = text.match(/\/attend\/([^/?#]+)/);
      if (attendMatch) {
        token = attendMatch[1];
      }

      const result = await attendanceApi.verifyAndJoin(token);
      if (result.success) {
        setStatus('success');
        setMessage(result.message || t('qrScan.attendanceRecorded'));
      } else {
        setStatus('error');
        setMessage(result.error || t('qrScan.failedToRecord'));
      }
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message || t('qrScan.failedToVerify'));
    }
  };

  // Auto-start camera on mount so tapping QR opens scanner immediately
  useEffect(() => {
    const timer = setTimeout(() => {
      startScanner();
    }, 300);
    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  const reset = () => {
    setStatus('idle');
    setMessage('');
    setScanning(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 pt-6 pb-5 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
            <QrCode size={20} />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-0.5">{t('qrScan.title')}</h1>
          <p className="text-sm text-slate-500">{t('qrScan.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 pt-5">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Scanner Area */}
          {(status === 'idle' || status === 'scanning') && (
            <div className="p-5">
              {!scanning ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
                    <Camera size={28} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{t('qrScan.readyToScan')}</p>
                  <p className="text-xs text-slate-400 mb-6">{t('qrScan.pointCamera')}</p>
                  <button
                    onClick={startScanner}
                    className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg text-sm transition-all active:scale-[0.98] hover:bg-primary-700 flex items-center justify-center gap-2"
                  >
                    <Camera size={16} />
                    {t('qrScan.openCamera')}
                  </button>
                </div>
              ) : (
                <div>
                  <div
                    id="qr-reader"
                    ref={containerRef}
                    className="rounded-lg overflow-hidden bg-black aspect-square"
                  />
                  <button
                    onClick={stopScanner}
                    className="w-full mt-3 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-lg text-sm transition-all hover:bg-slate-200"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Processing */}
          {status === 'processing' && (
            <div className="p-10 text-center">
              <Loader2 className="animate-spin text-primary-600 mx-auto mb-3" size={28} />
              <p className="text-sm text-slate-600">{message}</p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="p-8 text-center">
              <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900 mb-1">{t('qrScan.attendanceConfirmed')}</h2>
              <p className="text-sm text-emerald-600 mb-6">{message}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg text-sm transition-all active:scale-[0.98] hover:bg-primary-700"
              >
                {t('qrScan.backToHome')}
              </button>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="p-8 text-center">
              <XCircle size={32} className="text-rose-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900 mb-1">{t('qrScan.scanFailed')}</h2>
              <p className="text-sm text-rose-500 mb-6">{message}</p>
              <button
                onClick={reset}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg text-sm transition-all active:scale-[0.98] hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                {t('qrScan.tryAgain')}
              </button>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-700 mb-2">{t('qrScan.tips')}</div>
          <ul className="space-y-1.5 text-xs text-slate-500">
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">1.</span>
              {t('qrScan.tip1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">2.</span>
              {t('qrScan.tip2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">3.</span>
              {t('qrScan.tip3')}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudentQRScan;
