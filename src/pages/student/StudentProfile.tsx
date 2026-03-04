import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, MinusCircle, LogOut, TrendingUp, Award, Filter, X } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { attendanceApi } from '../../api/attendanceApi';
import toast from 'react-hot-toast';

const StudentProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lectureFilter, setLectureFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = await authApi.getCurrentUser();
      if (!user) { navigate('/login', { replace: true }); return; }
      const [p, r] = await Promise.all([
        authApi.getProfile(user.id),
        attendanceApi.getStudentAttendanceHistory(user.id)
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
      await authApi.signOut();
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
        <div className="bg-white border-b border-slate-200 px-4 pt-6 pb-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-200 animate-pulse" />
              <div className="space-y-2">
                <div className="w-36 h-5 rounded bg-slate-200 animate-pulse" />
                <div className="w-24 h-3 rounded bg-slate-200 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header with profile info */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 pt-6 pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-white">
                <span className="text-xl font-bold">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{profile?.full_name || 'Student'}</h1>
                <p className="text-sm text-slate-500">{profile?.email}</p>
                {profile?.serial_id && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                    ID: {profile.serial_id}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="sm:hidden w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <TrendingUp size={16} className="text-emerald-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-slate-900">{attendanceRate}%</div>
            <div className="text-xs text-slate-500 mt-0.5">Rate</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <Award size={16} className="text-primary-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-slate-900">{presentCount}</div>
            <div className="text-xs text-slate-500 mt-0.5">Present</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <Clock size={16} className="text-amber-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-slate-900">{totalHours.toFixed(1)}</div>
            <div className="text-xs text-slate-500 mt-0.5">Hours</div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Attendance History</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
              showFilters || lectureFilter !== 'all' || dateFrom || dateTo
                ? 'bg-primary-50 border-primary-200 text-primary-600'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <Filter size={13} />
            Filters
            {(lectureFilter !== 'all' || dateFrom || dateTo) && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (() => {
          const uniqueLectures = Array.from(
            new Map(
              records
                .filter(r => r.session?.lecture?.title)
                .map(r => [r.session.lecture.id || r.session.lecture.title, r.session.lecture.title])
            ).entries()
          );

          return (
            <div className="mb-3 p-3.5 bg-white rounded-xl border border-slate-200 space-y-3 animate-fade-in">
              {/* Lecture filter */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Lecture</label>
                <select
                  value={lectureFilter}
                  onChange={(e) => setLectureFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                >
                  <option value="all">All lectures</option>
                  {uniqueLectures.map(([id, title]) => (
                    <option key={id} value={title}>{title}</option>
                  ))}
                </select>
              </div>

              {/* Date range */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-500 mb-1 block">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-500 mb-1 block">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                  />
                </div>
              </div>

              {/* Clear filters */}
              {(lectureFilter !== 'all' || dateFrom || dateTo) && (
                <button
                  onClick={() => { setLectureFilter('all'); setDateFrom(''); setDateTo(''); }}
                  className="flex items-center gap-1 text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors"
                >
                  <X size={13} /> Clear filters
                </button>
              )}
            </div>
          );
        })()}

        {(() => {
          const filteredRecords = records.filter(r => {
            if (lectureFilter !== 'all') {
              const title = r.session?.lecture?.title || '';
              if (title !== lectureFilter) return false;
            }
            const recordDate = r.session?.session_date || r.time_joined;
            if (recordDate) {
              const d = new Date(recordDate);
              if (dateFrom && d < new Date(dateFrom)) return false;
              if (dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                if (d > to) return false;
              }
            }
            return true;
          });

          const showCount = filteredRecords.length !== records.length;

          return (
            <>
              {showCount && (
                <p className="text-xs text-slate-400 mb-2">
                  Showing {filteredRecords.length} of {records.length} sessions
                </p>
              )}

        {filteredRecords.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-xl border border-slate-200">
            <Calendar size={28} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500 mb-1">
              {records.length === 0 ? 'No attendance records' : 'No matching records'}
            </p>
            <p className="text-xs text-slate-400">
              {records.length === 0 ? 'Scan QR codes during class to track your attendance' : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {filteredRecords.map((record) => {
              const session = record.session;
              const isPresent = record.status === 'present';
              const isRemoved = record.status === 'removed';

              return (
                <div
                  key={record.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3.5"
                >
                  {/* Status icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isPresent ? 'bg-emerald-50 text-emerald-600' :
                    isRemoved ? 'bg-rose-50 text-rose-500' :
                    'bg-slate-50 text-slate-400'
                  }`}>
                    {isPresent ? <CheckCircle size={16} /> :
                     isRemoved ? <XCircle size={16} /> :
                     <MinusCircle size={16} />}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-900 truncate block">
                      {session?.lecture?.title || session?.class?.name || 'Session'}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {session?.session_date ? fmtDate(session.session_date) : fmtDate(record.time_joined)}
                      </span>
                      {record.time_joined && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {fmtTime(record.time_joined)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hours / Status badge */}
                  <div className="flex-shrink-0 text-right">
                    {isPresent && record.hours_attended ? (
                      <div>
                        <div className="text-sm font-semibold text-emerald-600">{record.hours_attended.toFixed(1)}h</div>
                        <div className="text-xs text-emerald-500">Present</div>
                      </div>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        isPresent ? 'bg-emerald-50 text-emerald-600' :
                        isRemoved ? 'bg-rose-50 text-rose-500' :
                        'bg-slate-50 text-slate-500'
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
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default StudentProfile;
