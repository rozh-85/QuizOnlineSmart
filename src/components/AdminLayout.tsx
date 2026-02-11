import { ReactNode, useState, useEffect } from 'react';
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
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { lectureQAService, subscribeToAllQuestions } from '../services/supabaseService';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const count = await lectureQAService.getUnreadCount();
        setUnreadCount(count);
      } catch (e) {
        console.error('Error fetching unread count:', e);
      }
    };
    fetchUnread();

    const sub = subscribeToAllQuestions(() => {
      // Add a small delay to allow Supabase to propagate the change fully
      setTimeout(fetchUnread, 150);
    });

    return () => {
      sub.unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('teacher_auth');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/lectures', icon: BookOpen, label: 'Lectures' },
    { path: '/admin/materials', icon: GraduationCap, label: 'Materials' },
    { path: '/admin/qa', icon: MessageSquare, label: 'Q&A Discussions', hasUnread: unreadCount > 0 },
    { path: '/admin/new', icon: Plus, label: 'New Question' },
    { path: '/admin/ai-generator', icon: Sparkles, label: 'AI Generator' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 relative">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-md">
                <GraduationCap size={22} className="text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">EduPulse Admin</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-1">
            <div className="mb-4 px-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Menu</p>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    active
                      ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={20} className={active ? 'text-primary-600' : ''} />
                  <span className="flex-1">{item.label}</span>
                  {(item as any).hasUnread && (
                    <div className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-pulse">
                      {unreadCount}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
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
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-50 rounded-lg transition-colors relative"
              >
                <Menu size={24} />
                {unreadCount > 0 && (
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all border border-slate-200 hover:border-rose-200"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
