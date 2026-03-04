import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  GraduationCap, 
  LogOut, 
  LayoutDashboard, 
  Plus, 
  Menu, 
  X, 
  BookOpen, 
  Sparkles, 
  MessageSquare,
  Users,
  ShieldCheck,
  FileText,
  ClipboardCheck,
  BarChart3,
  Megaphone
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/authApi';
import { useTeacherUnreadCount } from '../hooks/useUnreadCount';
import { ROUTES } from '../constants/routes';
import LanguageSwitcher from './LanguageSwitcher';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useTeacherUnreadCount({ channelPrefix: 'admin-layout' });

  const { t } = useTranslation();

  const handleLogout = async () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
    localStorage.removeItem('teacher_auth');
    try {
      await authApi.signOut();
      toast.success(t('auth.loggedOut'));
      navigate(ROUTES.ADMIN_LOGIN, { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t('auth.failedToLogout'));
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const mainMenuItems = [
    { path: '/admin', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/admin/classes', icon: BookOpen, label: t('nav.classes') },
    { path: '/admin/students', icon: Users, label: t('nav.students') },
    { path: '/admin/lectures', icon: GraduationCap, label: t('nav.lectures') },
    { path: '/admin/materials', icon: FileText, label: t('nav.materials') },
    { path: '/admin/qa', icon: MessageSquare, label: t('nav.qaDiscussions'), hasUnread: unreadCount > 0 },
  ];

  const toolsItems = [
    { path: '/admin/new', icon: Plus, label: t('nav.newQuestion') },
    { path: '/admin/whats-new', icon: Megaphone, label: t('nav.whatsNew') },
    { path: '/admin/ai-generator', icon: Sparkles, label: t('nav.aiGenerator') },
    { path: '/admin/exam-builder', icon: ShieldCheck, label: t('nav.examBuilder') },
    { path: '/admin/attendance', icon: ClipboardCheck, label: t('nav.attendance') },
    { path: '/admin/reports', icon: BarChart3, label: t('nav.reports') },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 relative">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 z-50 w-72 bg-white border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l ${sidebarOpen ? 'translate-x-0' : 'max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full'}`}>
        <div className="flex flex-col h-full lg:h-screen">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">{t('common.appName')}</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{t('common.adminPanel')}</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6">
            {/* Main Menu Section */}
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all mb-1 ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className="flex-1">{item.label}</span>
                  {(item as any).hasUnread && (
                    <div className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </div>
                  )}
                </Link>
              );
            })}

            {/* Tools Section */}
            <div className="mt-6 mb-2 px-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('nav.tools')}</p>
            </div>
            {toolsItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all mb-1 ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button at Bottom */}
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all w-full"
            >
              <LogOut size={18} className="text-slate-400" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-50 rounded-lg transition-colors relative"
            >
              <Menu size={24} />
              {unreadCount > 0 && (
                <div className="absolute top-1.5 end-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>
            <div className="flex items-center gap-3 ms-auto">
              <LanguageSwitcher variant="full" />
              <div className="hidden lg:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('common.systemOnline')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
