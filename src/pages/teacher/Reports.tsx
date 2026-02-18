import { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart3,
  Search,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Clock,
  Users,
  ChevronDown,
  X,
  Loader2,
  ArrowLeft,
  User
} from 'lucide-react';
import { classService, lectureService, studentService, reportService } from '../../services/supabaseService';
import toast from 'react-hot-toast';
import { PageHeader, FormField, EmptyState } from '../../components/ui';

const Reports = () => {
  // Filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Data states
  const [classes, setClasses] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [enrolledCounts, setEnrolledCounts] = useState<Record<string, number>>({});

  // UI states
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const studentDropdownRef = useRef<HTMLDivElement>(null);

  // Close student dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(e.target as Node)) {
        setShowStudentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Load filter options
  useEffect(() => {
    const init = async () => {
      try {
        const [cls, lecs, studs] = await Promise.all([
          classService.getAll(),
          lectureService.getAll(),
          studentService.getAll()
        ]);
        setClasses(cls);
        setLectures(lecs);
        setStudents(studs);
      } catch (e) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Fetch sessions when filters change
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(fetchSessions, 300);
    return () => clearTimeout(timer);
  }, [selectedStudent, selectedClassId, selectedLectureId, dateFrom, dateTo, loading]);

  const fetchSessions = async () => {
    setFetching(true);
    try {
      const data = await reportService.getReportSessions({
        studentId: selectedStudent?.id || undefined,
        classId: selectedClassId || undefined,
        lectureId: selectedLectureId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setSessions(data);

      const classIds = [...new Set(data.map((s: any) => s.class_id))] as string[];
      const counts = await reportService.getEnrolledCounts(classIds);
      setEnrolledCounts(counts);
    } catch (e: any) {
      console.error('Failed to fetch reports:', e);
      toast.error('Failed to fetch reports');
    } finally {
      setFetching(false);
    }
  };

  // Utility functions
  const getSessionDurationHours = (session: any): number => {
    if (!session.started_at || !session.ended_at) return 0;
    const start = new Date(session.started_at).getTime();
    const end = new Date(session.ended_at).getTime();
    return Math.max(0, (end - start) / (1000 * 60 * 60));
  };

  const getSessionEndTime = (session: any): string | null => {
    const records = session.records || [];
    const timesLeft = records
      .filter((r: any) => r.time_left)
      .map((r: any) => new Date(r.time_left).getTime());
    if (timesLeft.length === 0) return session.ended_at;
    return new Date(Math.max(...timesLeft)).toISOString();
  };

  const formatDuration = (hours: number): string => {
    if (!hours || hours <= 0) return '0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const formatTime = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Summary calculation
  const summary = useMemo(() => {
    let totalHours = 0;
    let presentHours = 0;

    sessions.forEach((session: any) => {
      const duration = getSessionDurationHours(session);
      const presentRecords = (session.records || []).filter((r: any) => r.status === 'present');

      if (selectedStudent) {
        totalHours += duration;
        const studentRecord = presentRecords.find((r: any) => r.student_id === selectedStudent.id);
        presentHours += studentRecord?.hours_attended || 0;
      } else {
        const enrolled = enrolledCounts[session.class_id] || presentRecords.length || 1;
        totalHours += duration * enrolled;
        presentHours += presentRecords.reduce((sum: number, r: any) => sum + (r.hours_attended || 0), 0);
      }
    });

    return {
      totalHours,
      presentHours,
      absentHours: Math.max(0, totalHours - presentHours)
    };
  }, [sessions, selectedStudent, enrolledCounts]);

  // Filtered students for dropdown
  const filteredStudents = studentSearch.trim()
    ? students.filter((s: any) =>
        s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.serial_id?.toLowerCase().includes(studentSearch.toLowerCase())
      ).slice(0, 10)
    : [];

  const clearFilters = () => {
    setSelectedStudent(null);
    setStudentSearch('');
    setSelectedClassId('');
    setSelectedLectureId('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = selectedStudent || selectedClassId || selectedLectureId || dateFrom || dateTo;

  if (loading) {
    return (
      <div className="animate-fade-in w-full">
        {/* Skeleton Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="w-36 h-7 rounded-lg bg-slate-200/60 animate-pulse" />
            <div className="w-56 h-4 rounded bg-slate-200/60 animate-pulse" />
          </div>
        </div>
        {/* Skeleton Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-11 flex-1 max-w-xs rounded-xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
        {/* Skeleton Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-200/60" />
                <div className="w-12 h-7 rounded bg-slate-200/60" />
              </div>
              <div className="w-20 h-3 rounded bg-slate-200/60" />
            </div>
          ))}
        </div>
        {/* Skeleton Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-20 h-3 rounded bg-slate-200/60 animate-pulse" />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="px-6 py-4 flex gap-8 border-b border-slate-100 animate-pulse">
              <div className="w-32 h-4 rounded bg-slate-200/60" />
              <div className="w-24 h-4 rounded bg-slate-200/60" />
              <div className="w-20 h-4 rounded bg-slate-200/60" />
              <div className="w-16 h-4 rounded bg-slate-200/60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detail view
  if (selectedSession) {
    return (
      <SessionDetail
        session={selectedSession}
        onBack={() => setSelectedSession(null)}
        formatDuration={formatDuration}
        formatTime={formatTime}
      />
    );
  }

  return (
    <div className="animate-fade-in w-full">
      {/* Header */}
      <PageHeader
        title="Reports."
        badge="Analytics"
        subtitle="View attendance reports and analytics"
        action={
          hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl border border-slate-200 hover:border-rose-200 transition-all"
            >
              <X size={14} />
              Clear Filters
            </button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Student Search */}
          <div className="space-y-1.5 relative" ref={studentDropdownRef}>
            <label className="text-xs font-bold text-slate-500">Student</label>
            {selectedStudent ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-primary-50 border border-primary-200 rounded-xl">
                <User size={16} className="text-primary-600 shrink-0" />
                <span className="flex-1 font-bold text-primary-700 text-sm truncate">{selectedStudent.full_name}</span>
                <button
                  onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}
                  className="text-primary-400 hover:text-primary-700 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={studentSearch}
                    onChange={(e) => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }}
                    onFocus={() => setShowStudentDropdown(true)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
                  />
                </div>
                {showStudentDropdown && filteredStudents.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredStudents.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedStudent(s);
                          setStudentSearch('');
                          setShowStudentDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center gap-3"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {s.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-700">{s.full_name}</div>
                          <div className="text-[10px] text-slate-400">{s.serial_id || s.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Date From */}
          <FormField label="From Date">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
              />
            </div>
          </FormField>

          {/* Date To */}
          <FormField label="To Date">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
              />
            </div>
          </FormField>

          {/* Class */}
          <FormField label="Class">
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 appearance-none cursor-pointer text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
              >
                <option value="">All Classes</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </FormField>

          {/* Lecture */}
          <FormField label="Lecture">
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedLectureId}
                onChange={(e) => setSelectedLectureId(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 appearance-none cursor-pointer text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
              >
                <option value="">All Lectures</option>
                {lectures.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </FormField>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Clock size={18} className="text-slate-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Hours</p>
              <p className="text-xl font-black text-slate-900">{formatDuration(summary.totalHours)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Clock size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Present</p>
              <p className="text-xl font-black text-emerald-700">{formatDuration(summary.presentHours)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-rose-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <Clock size={18} className="text-rose-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Absent</p>
              <p className="text-xl font-black text-rose-700">{formatDuration(summary.absentHours)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-black text-slate-900 tracking-tight">
            Sessions {!fetching && `(${sessions.length})`}
          </h2>
          {fetching && <Loader2 className="animate-spin text-primary-600" size={16} />}
        </div>

        {sessions.length === 0 && !fetching ? (
          <EmptyState
            icon={<BarChart3 size={28} />}
            title="No Sessions Found"
            subtitle="Adjust your filters or create attendance sessions first"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {sessions.map((session: any) => {
              const endTime = getSessionEndTime(session);
              const duration = getSessionDurationHours(session);
              const presentCount = (session.records || []).filter((r: any) => r.status === 'present').length;

              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="bg-white border border-slate-200 rounded-2xl p-4 text-left hover:border-primary-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="text-sm font-black text-slate-900 group-hover:text-primary-700 transition-colors">
                        {session.lecture?.title || 'No Lecture'}
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">
                        {session.class?.name || 'Unknown Class'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg shrink-0">
                      <Users size={12} />
                      {presentCount}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Date</span>
                      <span className="font-bold text-slate-600">{formatDate(session.session_date)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Start</span>
                      <span className="font-bold text-slate-600">{formatTime(session.started_at)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">End</span>
                      <span className="font-bold text-slate-600">{formatTime(endTime)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                      <span className="text-slate-400 font-medium">Duration</span>
                      <span className="font-bold text-primary-600">{formatDuration(duration)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Session Detail Sub-Component
const SessionDetail = ({
  session,
  onBack,
  formatDuration,
  formatTime
}: {
  session: any;
  onBack: () => void;
  formatDuration: (hours: number) => string;
  formatTime: (dateStr: string | null) => string;
}) => {
  const records = (session.records || []).sort((a: any, b: any) =>
    new Date(a.time_joined).getTime() - new Date(b.time_joined).getTime()
  );
  const presentRecords = records.filter((r: any) => r.status === 'present');
  const removedRecords = records.filter((r: any) => r.status === 'removed');

  const getSessionDuration = (): number => {
    if (!session.started_at || !session.ended_at) return 0;
    const start = new Date(session.started_at).getTime();
    const end = new Date(session.ended_at).getTime();
    return Math.max(0, (end - start) / (1000 * 60 * 60));
  };

  const totalDuration = getSessionDuration();

  return (
    <div className="animate-fade-in w-full">
      {/* Back button + Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Reports
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {session.lecture?.title || 'No Lecture'}
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm text-slate-500 font-medium">{session.class?.name || 'Unknown Class'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-slate-500 font-medium">
                  {new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-slate-900 text-white px-4 py-2 rounded-xl font-mono text-lg font-bold">
                {formatDuration(totalDuration)}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Total Session<br />Time
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-xs font-bold text-slate-600">{presentRecords.length} Present</span>
        </div>
        {removedRecords.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-rose-500 rounded-full" />
            <span className="text-xs font-bold text-slate-600">{removedRecords.length} Removed</span>
          </div>
        )}
      </div>

      {/* Participants Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-5 py-3">Code</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-5 py-3">Name</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-5 py-3">Start Time</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-5 py-3">End Time</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-5 py-3">Duration</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record: any) => (
                <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {record.student?.serial_id || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        record.status === 'removed' ? 'bg-rose-200 text-rose-700' : 'bg-slate-900 text-white'
                      }`}>
                        {record.student?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{record.student?.full_name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-slate-600">{formatTime(record.time_joined)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-slate-600">{formatTime(record.time_left)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-bold ${record.status === 'removed' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatDuration(record.hours_attended || 0)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                      record.status === 'removed'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length === 0 && (
          <div className="py-12 text-center">
            <Users size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-bold">No participants recorded</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
