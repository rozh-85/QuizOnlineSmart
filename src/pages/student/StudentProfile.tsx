import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, MinusCircle, LogOut, TrendingUp, Award } from 'lucide-react';
import { authService, attendanceService } from '../../services/supabaseService';
import toast from 'react-hot-toast';

const StudentProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) { navigate('/login', { replace: true }); return; }
      const [p, r] = await Promise.all([
        authService.getProfile(user.id),
        attendanceService.getStudentAttendanceHistory(user.id)
      ]);
      setProfile(p);
      setRecords(r);
    } catch (e) {
      console.error('Profile fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

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

  const totalHours = records
    .filter(r => r.status === 'present')
    .reduce((sum, r) => sum + (r.hours_attended || 0), 0);

  const presentCount = records.filter(r => r.status === 'present').length;
  const attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  const fmtDate = (d: string) => {
    return new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const fmtTime = (d: string) => {
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="bg-gradient-to-br from-primary-50 via-slate-50 to-white px-4 pt-8 pb-14">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-200/60 animate-pulse" />
              <div className="space-y-2">
                <div className="w-40 h-5 rounded bg-slate-200/60 animate-pulse" />
                <div className="w-24 h-3 rounded bg-slate-200/60 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 -mt-6">
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-white border border-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header with profile info */}
      <div className="bg-gradient-to-br from-primary-50 via-slate-50 to-white px-4 sm:px-6 pt-8 pb-14">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-200">
                <span className="text-2xl font-black">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{profile?.full_name || 'Student'}</h1>
                <p className="text-xs text-slate-400 font-medium">{profile?.email}</p>
                {profile?.serial_id && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-[9px] font-black uppercase tracking-wider rounded-md">
                    ID: {profile.serial_id}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-slate-100"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <TrendingUp size={16} />
            </div>
            <div className="text-2xl font-black text-slate-900">{attendanceRate}%</div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Rate</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-2">
              <Award size={16} />
            </div>
            <div className="text-2xl font-black text-slate-900">{presentCount}</div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Present</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
              <Clock size={16} />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalHours.toFixed(1)}</div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Hours</div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-sm font-black text-slate-900 tracking-tight">Attendance History</h2>
          <div className="h-px flex-1 bg-slate-100" />
          <span className="text-[10px] font-bold text-slate-400">{records.length} Sessions</span>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-400 mb-1">No attendance records</p>
            <p className="text-xs text-slate-300">Scan QR codes during class to track your attendance</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {records.map((record) => {
              const session = record.session;
              const isPresent = record.status === 'present';
              const isRemoved = record.status === 'removed';

              return (
                <div
                  key={record.id}
                  className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4 hover:shadow-sm transition-all"
                >
                  {/* Status icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isPresent ? 'bg-emerald-50 text-emerald-600' :
                    isRemoved ? 'bg-rose-50 text-rose-500' :
                    'bg-slate-50 text-slate-400'
                  }`}>
                    {isPresent ? <CheckCircle size={18} /> :
                     isRemoved ? <XCircle size={18} /> :
                     <MinusCircle size={18} />}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {session?.lecture?.title || session?.class?.name || 'Session'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {session?.session_date ? fmtDate(session.session_date) : fmtDate(record.time_joined)}
                      </span>
                      {record.time_joined && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {fmtTime(record.time_joined)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hours / Status badge */}
                  <div className="flex-shrink-0 text-right">
                    {isPresent && record.hours_attended ? (
                      <div>
                        <div className="text-sm font-black text-emerald-600">{record.hours_attended.toFixed(1)}h</div>
                        <div className="text-[9px] font-bold text-emerald-400 uppercase">Present</div>
                      </div>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                        isPresent ? 'bg-emerald-50 text-emerald-600' :
                        isRemoved ? 'bg-rose-50 text-rose-500' :
                        'bg-slate-50 text-slate-400'
                      }`}>
                        {record.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
