import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Sparkles, QrCode, MessageSquare, User, Beaker, LogOut, BookOpen, X, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import { useQuiz } from '../context/QuizContext';
import { authApi } from '../api/authApi';
import { attendanceApi } from '../api/attendanceApi';
import toast from 'react-hot-toast';
import LanguageSwitcher from './LanguageSwitcher';

interface StudentLayoutProps {
  children: ReactNode;
  unreadCount?: number;
  unreadNewsCount?: number;
}

const StudentLayout = ({ children, unreadCount = 0, unreadNewsCount = 0 }: StudentLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lectures } = useQuiz();
  const { t } = useTranslation();

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
    setQrMessage(t('qr.verifyingAttendance'));
    try {
      let token = text;
      const attendMatch = text.match(/\/attend\/([^/?#]+)/);
      if (attendMatch) token = attendMatch[1];
      const result = await attendanceApi.verifyAndJoin(token);
      if (result.success) {
        setQrStatus('success');
        setQrMessage(result.message || t('qr.attendanceRecorded'));
      } else {
        setQrStatus('error');
        setQrMessage(result.error || t('qr.failedToRecord'));
      }
    } catch (e: any) {
      setQrStatus('error');
      setQrMessage(e.message || t('qr.failedToVerify'));
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
      setQrMessage(err?.message || t('qr.cameraPermission'));
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
      await authApi.signOut();
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
      });
      toast.success(t('auth.loggedOut'));
      navigate('/login', { replace: true });
    } catch {
      toast.error(t('auth.logoutFailed'));
    }
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: t('nav.home') },
    { path: '/news', icon: Sparkles, label: t('nav.news'), badge: unreadNewsCount },
    { path: '/scan', icon: QrCode, label: t('nav.qr') },
    { path: '/chat', icon: MessageSquare, label: t('nav.chat'), badge: unreadCount },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ── Desktop Top Navigation Bar (hidden on mobile) ── */}
      <header className="hidden sm:block sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-5xl xl:max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Beaker size={15} className="text-white" />
              </div>
              <span className="text-base font-bold text-slate-900">{t('common.eduPulse')}</span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="flex items-center gap-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const isQR = item.path === '/scan';

                if (isQR) {
                  return (
                    <button
                      key={item.path}
                      onClick={openQrOverlay}
                      className="relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all text-primary-600 hover:bg-primary-50"
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-primary-50 text-primary-600 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="min-w-[18px] h-[18px] px-1 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}

              <div className="w-px h-5 bg-slate-200 mx-1.5" />
              <Link
                to="/dashboard"
                onClick={(e) => {
                  if (location.pathname === '/dashboard') {
                    e.preventDefault();
                    document.getElementById('lectures-section')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <BookOpen size={16} />
                <span>{t('nav.lectures')}</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-semibold">{lectures.length}</span>
              </Link>

              <div className="w-px h-5 bg-slate-200 mx-1.5" />
              <LanguageSwitcher />
              <div className="w-px h-5 bg-slate-200 mx-1.5" />
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
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

      {/* ── QR Scanner Fullscreen Overlay ── */}
      {qrOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] py-4">
            <h2 className="text-white font-bold text-lg">{t('qr.scanQRCode')}</h2>
            <button onClick={closeQrOverlay} className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X size={20} className="text-white" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {qrStatus === 'scanning' && (
              <div className="w-full max-w-sm">
                <div id="qr-overlay-reader" className="rounded-xl overflow-hidden bg-black aspect-square" />
                <p className="text-center text-white/50 text-sm mt-4">{t('qr.pointCamera')}</p>
              </div>
            )}

            {qrStatus === 'processing' && (
              <div className="text-center">
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="animate-spin text-white" size={24} />
                </div>
                <p className="text-sm font-medium text-white/80">{qrMessage}</p>
              </div>
            )}

            {qrStatus === 'success' && (
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={24} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{t('qr.attendanceConfirmed')}</h3>
                <p className="text-sm text-emerald-400 mb-6">{qrMessage}</p>
                <button onClick={closeQrOverlay} className="w-full max-w-xs py-3 bg-white text-slate-900 font-semibold rounded-lg text-sm hover:bg-slate-100 transition-colors">
                  {t('common.done')}
                </button>
              </div>
            )}

            {qrStatus === 'error' && (
              <div className="text-center">
                <div className="w-14 h-14 bg-rose-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <XCircle size={24} className="text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{t('qr.scanFailed')}</h3>
                <p className="text-sm text-rose-400 mb-6">{qrMessage}</p>
                <button
                  onClick={() => { setQrStatus('scanning'); setQrMessage(''); }}
                  className="w-full max-w-xs py-3 bg-white text-slate-900 font-semibold rounded-lg text-sm flex items-center justify-center gap-2 mx-auto hover:bg-slate-100 transition-colors"
                >
                  <RefreshCw size={16} /> {t('common.tryAgain')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation Bar (only on mobile) ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200">
        <div className="flex items-center justify-around px-1 pt-1.5 pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isQR = item.path === '/scan';

            if (isQR) {
              return (
                <button
                  key={item.path}
                  onClick={openQrOverlay}
                  className="relative flex flex-col items-center justify-center py-1.5 px-1.5 text-primary-600 active:scale-95 transition-transform min-w-0"
                >
                  <div className="relative w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-semibold mt-0.5 text-primary-600">{t('nav.scan')}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1.5 transition-colors min-w-0 ${
                  active ? 'text-primary-600' : 'text-slate-400'
                }`}
              >
                <div className="relative">
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1.5 -end-1 min-w-[16px] h-[16px] px-0.5 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[10px] mt-0.5 truncate max-w-full ${
                  active ? 'text-primary-600 font-semibold' : 'text-slate-400 font-medium'
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
