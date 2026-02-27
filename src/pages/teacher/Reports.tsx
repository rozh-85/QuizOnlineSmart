import { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart3,
  Search,
  CalendarDays,
  BookOpen,
  GraduationCap,
  ChevronDown,
  X,
  Loader2,
  User
} from 'lucide-react';
import { classService, lectureService, studentService, reportService } from '../../services/supabaseService';
import toast from 'react-hot-toast';
import { PageHeader, FormField, EmptyState } from '../../components/ui';
import { SessionDetail, SessionCard, ReportSummaryCards } from '../../components/reports';

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
      <ReportSummaryCards
        totalHours={summary.totalHours}
        presentHours={summary.presentHours}
        absentHours={summary.absentHours}
        formatDuration={formatDuration}
      />

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
            {sessions.map((session: any) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => setSelectedSession(session)}
                formatDate={formatDate}
                formatTime={formatTime}
                formatDuration={formatDuration}
                getSessionEndTime={getSessionEndTime}
                getSessionDurationHours={getSessionDurationHours}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
