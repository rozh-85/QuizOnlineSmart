import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Sparkles, QrCode, Bell, User, Beaker, LogOut, BookOpen, X, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useQuiz } from '../context/QuizContext';
import { authService, attendanceService } from '../services/supabaseService';
import toast from 'react-hot-toast';

interface StudentLayoutProps {
  children: ReactNode;
  unreadCount?: number;
}

const StudentLayout = ({ children, unreadCount = 0 }: StudentLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lectures } = useQuiz();

  // QR Scanner overlay state
  const [qrOpen, setQrOpen] = useState(false);
  const [qrStatus, setQrStatus] = useState<'scanning' | 'processing' | 'success' | 'error'>('scanning');
  const [qrMessage, setQrMessage] = useState('');
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  const stopQrScanner = useCallback(async () => {
    try {
      if (qrScannerRef.current?.isScanning) {
        await qrScannerRef.current.stop();
      }
    } catch { /* ignore */ }
  }, []);

  const handleQrResult = useCallback(async (text: string) => {
    setQrStatus('processing');
    setQrMessage('Verifying attendance...');
    try {
      let token = text;
      const attendMatch = text.match(/\/attend\/([^/?#]+)/);
      if (attendMatch) token = attendMatch[1];
      const result = await attendanceService.verifyAndJoin(token);
      if (result.success) {
        setQrStatus('success');
        setQrMessage(result.message || 'Attendance recorded successfully!');
      } else {
        setQrStatus('error');
        setQrMessage(result.error || 'Failed to record attendance');
      }
    } catch (e: any) {
      setQrStatus('error');
      setQrMessage(e.message || 'Failed to verify attendance.');
    }
  }, []);

  const startQrScanner = useCallback(async () => {
    setQrStatus('scanning');
    setQrMessage('');
    try {
      const scanner = new Html5Qrcode('qr-overlay-reader');
      qrScannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        async (decodedText) => {
          await stopQrScanner();
          handleQrResult(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      setQrStatus('error');
      setQrMessage(err?.message || 'Could not access camera. Please allow camera permissions.');
    }
  }, [stopQrScanner, handleQrResult]);

  const openQrOverlay = useCallback(() => {
    setQrOpen(true);
    setQrStatus('scanning');
    setQrMessage('');
  }, []);

  const closeQrOverlay = useCallback(async () => {
    await stopQrScanner();
    setQrOpen(false);
    setQrStatus('scanning');
    setQrMessage('');
  }, [stopQrScanner]);

  useEffect(() => {
    if (qrOpen && qrStatus === 'scanning') {
      const timer = setTimeout(() => startQrScanner(), 350);
      return () => clearTimeout(timer);
    }
  }, [qrOpen, qrStatus, startQrScanner]);

  useEffect(() => {
    return () => { stopQrScanner(); };
  }, [stopQrScanner]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
      });
      toast.success('Logged out');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Logout failed');
    }
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/news', icon: Sparkles, label: 'News' },
    { path: '/scan', icon: QrCode, label: 'QR' },
    { path: '/notifications', icon: Bell, label: 'Alerts', badge: unreadCount },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-primary-50/20">
      {/* ── Desktop Top Navigation Bar (hidden on mobile) ── */}
      <header className="hidden sm:block sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/50 shadow-sm">
        <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md group-hover:shadow-primary-200 transition-all">
                <Beaker size={16} className="text-white" />
              </div>
              <div>
                <span className="text-lg font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tighter">EduPulse</span>
                <div className="text-[9px] font-bold text-primary-600 uppercase tracking-[0.15em] -mt-0.5">Chemistry</div>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      active
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="absolute -top-0.5 right-1 min-w-[16px] h-[16px] px-1 bg-rose-500 rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-white">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}

              {/* Lectures dropdown-style link */}
              <div className="w-px h-6 bg-slate-200 mx-2" />
              <Link
                to="/dashboard"
                onClick={(e) => {
                  if (location.pathname === '/dashboard') {
                    e.preventDefault();
                    document.getElementById('lectures-section')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <BookOpen size={16} />
                <span>Lectures</span>
                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-black">{lectures.length}</span>
              </Link>

              <div className="w-px h-6 bg-slate-200 mx-2" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut size={16} />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 pb-20 sm:pb-0">
        {children}
      </main>

      {/* ── QR Scanner Fullscreen Overlay (mobile) ── */}
      {qrOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fade-in">
          {/* Overlay header */}
          <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] py-4">
            <h2 className="text-white font-black text-lg">Scan QR Code</h2>
            <button onClick={closeQrOverlay} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <X size={20} className="text-white" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {qrStatus === 'scanning' && (
              <div className="w-full max-w-sm">
                <div id="qr-overlay-reader" className="rounded-2xl overflow-hidden bg-black aspect-square" />
                <p className="text-center text-white/60 text-xs font-medium mt-4">Point your camera at the QR code</p>
              </div>
            )}

            {qrStatus === 'processing' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="animate-spin text-white" size={28} />
                </div>
                <p className="text-sm font-bold text-white/80">{qrMessage}</p>
              </div>
            )}

            {qrStatus === 'success' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-black text-white mb-2">Attendance Confirmed</h3>
                <p className="text-sm font-medium text-emerald-400 mb-6">{qrMessage}</p>
                <button onClick={closeQrOverlay} className="w-full max-w-xs py-3.5 bg-white text-slate-900 font-bold rounded-xl text-sm">
                  Done
                </button>
              </div>
            )}

            {qrStatus === 'error' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <XCircle size={28} className="text-rose-400" />
                </div>
                <h3 className="text-lg font-black text-white mb-2">Scan Failed</h3>
                <p className="text-sm font-medium text-rose-400 mb-6">{qrMessage}</p>
                <button
                  onClick={() => { setQrStatus('scanning'); setQrMessage(''); }}
                  className="w-full max-w-xs py-3.5 bg-white text-slate-900 font-bold rounded-xl text-sm flex items-center justify-center gap-2 mx-auto"
                >
                  <RefreshCw size={16} /> Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation Bar (only on mobile) ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isQR = item.path === '/scan';

            if (isQR) {
              return (
                <button
                  key={item.path}
                  onClick={openQrOverlay}
                  className="relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all -mt-5"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all bg-primary-600 shadow-primary-200 hover:bg-primary-700 active:scale-95">
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className="text-[8px] font-bold mt-1 text-primary-600">Scan</span>
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${
                  active ? 'text-primary-600' : 'text-slate-400'
                }`}
              >
                <div className={`relative p-1 rounded-xl transition-all ${active ? 'bg-primary-50' : ''}`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-rose-500 rounded-full text-[7px] font-black text-white flex items-center justify-center border border-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[9px] font-bold mt-0.5 transition-all ${
                  active ? 'text-primary-600 font-black' : 'text-slate-400'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area for devices with home indicator */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
};

export default StudentLayout;
