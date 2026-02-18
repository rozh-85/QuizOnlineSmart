import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Camera, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { attendanceService } from '../../services/supabaseService';

const StudentQRScan = () => {
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
      setMessage(err?.message || 'Could not access camera. Please allow camera permissions.');
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
    setMessage('Verifying attendance...');

    try {
      // Extract token from URL - handle both full URLs and raw tokens
      let token = text;
      
      // If it's a URL like https://domain/#/attend/TOKEN or #/attend/TOKEN
      const attendMatch = text.match(/\/attend\/([^/?#]+)/);
      if (attendMatch) {
        token = attendMatch[1];
      }

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
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 px-4 sm:px-6 pt-8 pb-14 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/10">
            <QrCode size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-1">QR Attendance</h1>
          <p className="text-sm text-slate-400 font-medium">Scan the QR code shown by your teacher</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 -mt-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
          {/* Scanner Area */}
          {(status === 'idle' || status === 'scanning') && (
            <div className="p-6">
              {!scanning ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <Camera size={36} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-500 mb-1">Ready to scan</p>
                  <p className="text-xs text-slate-400 mb-8">Point your camera at the QR code</p>
                  <button
                    onClick={startScanner}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98] hover:bg-primary-600 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Camera size={18} />
                    Open Camera
                  </button>
                </div>
              ) : (
                <div>
                  <div
                    id="qr-reader"
                    ref={containerRef}
                    className="rounded-xl overflow-hidden bg-black aspect-square"
                  />
                  <button
                    onClick={stopScanner}
                    className="w-full mt-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm transition-all hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Processing */}
          {status === 'processing' && (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Loader2 className="animate-spin text-primary-600" size={28} />
              </div>
              <p className="text-sm font-bold text-slate-600">{message}</p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-600" />
              </div>
              <h2 className="text-lg font-black text-slate-900 mb-2">Attendance Confirmed</h2>
              <p className="text-sm font-medium text-emerald-600 mb-6">{message}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98] hover:bg-primary-600"
              >
                Back to Home
              </button>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle size={28} className="text-rose-600" />
              </div>
              <h2 className="text-lg font-black text-slate-900 mb-2">Scan Failed</h2>
              <p className="text-sm font-medium text-rose-500 mb-6">{message}</p>
              <button
                onClick={reset}
                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98] hover:bg-primary-600 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Tips</div>
          <ul className="space-y-2 text-xs text-slate-500 font-medium">
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">1.</span>
              Ask your teacher to display the attendance QR code
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">2.</span>
              Hold your device steady and point the camera at the code
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">3.</span>
              Your attendance will be recorded automatically
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudentQRScan;
