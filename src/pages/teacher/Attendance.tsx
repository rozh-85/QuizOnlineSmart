import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CalendarDays,
  ChevronDown,
  Play,
  Square,
  Eye,
  EyeOff,
  UserX,
  Clock,
  Users,
  QrCode,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { classService, attendanceService, authService } from '../../services/supabaseService';
import toast from 'react-hot-toast';

type SessionStatus = 'idle' | 'pending' | 'active' | 'completed';

interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  class_id: string;
  time_joined: string;
  time_left: string | null;
  hours_attended: number;
  status: 'present' | 'removed';
  student: {
    id: string;
    full_name: string;
    serial_id: string | null;
    email: string;
  };
}

const Attendance = () => {
  // Core state
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const [startedAt, setStartedAt] = useState<Date | null>(null);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // QR state
  const [qrVisible, setQrVisible] = useState(true);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Attendance records
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize: fetch teacher info + classes
  useEffect(() => {
    const init = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setTeacherId(user.id);
        }
        const cls = await classService.getAll();
        setClasses(cls);
      } catch (e) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Timer effect
  useEffect(() => {
    if (sessionStatus === 'active' && startedAt) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStatus, startedAt]);

  // QR token refresh effect
  const refreshQrToken = useCallback(async () => {
    if (!sessionId) return;
    try {
      // Deactivate old tokens
      await attendanceService.deactivateSessionTokens(sessionId);
      // Create new one
      const tokenData = await attendanceService.createToken(sessionId);
      setCurrentToken(tokenData.token);
    } catch (e) {
      console.error('Failed to refresh QR token:', e);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionStatus === 'active' && qrVisible && sessionId) {
      // Generate immediately
      refreshQrToken();
      // Then every 2 seconds
      qrIntervalRef.current = setInterval(refreshQrToken, 3000);
    } else {
      // Stop generating and deactivate current tokens
      if (qrIntervalRef.current) {
        clearInterval(qrIntervalRef.current);
        qrIntervalRef.current = null;
      }
      if (sessionId && sessionStatus === 'active' && !qrVisible) {
        attendanceService.deactivateSessionTokens(sessionId);
        setCurrentToken(null);
      }
    }
    return () => {
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    };
  }, [sessionStatus, qrVisible, sessionId, refreshQrToken]);

  // Poll attendance records
  useEffect(() => {
    if (sessionStatus === 'active' && sessionId) {
      const fetchRecords = async () => {
        try {
          const data = await attendanceService.getSessionRecords(sessionId);
          setRecords(data);
        } catch (e) {
          console.error('Failed to fetch records:', e);
        }
      };
      fetchRecords();
      pollRef.current = setInterval(fetchRecords, 3000);

      // Also subscribe to realtime
      const channel = supabase
        .channel(`attendance_records_${sessionId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `session_id=eq.${sessionId}`
        }, () => {
          fetchRecords();
        })
        .subscribe();

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
        channel.unsubscribe();
      };
    }
  }, [sessionStatus, sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Format elapsed seconds
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Build the QR URL that students will scan
  const getQrValue = (): string => {
    if (!currentToken) return '';
    // URL that the student app will handle
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#/attend/${currentToken}`;
  };

  // Handlers
  const handleCreateSession = async () => {
    if (!selectedClassId || !teacherId) {
      toast.error('Please select a class');
      return;
    }
    try {
      const session = await attendanceService.createSession(selectedClassId, teacherId, sessionDate);
      setSessionId(session.id);
      setSessionStatus('pending');
      toast.success('Session created. Click Start to begin.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create session');
    }
  };

  const handleStart = async () => {
    if (!sessionId) return;
    try {
      const session = await attendanceService.startSession(sessionId);
      setSessionStatus('active');
      setStartedAt(new Date(session.started_at));
      setElapsed(0);
      setQrVisible(true);
      toast.success('Session started!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to start session');
    }
  };

  const handleStop = async () => {
    if (!sessionId) return;
    if (!window.confirm('Stop this session? All student timers will be finalized.')) return;
    try {
      await attendanceService.stopSession(sessionId);
      setSessionStatus('completed');
      setQrVisible(false);
      setCurrentToken(null);
      if (timerRef.current) clearInterval(timerRef.current);
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      // Fetch final records
      const finalRecords = await attendanceService.getSessionRecords(sessionId);
      setRecords(finalRecords);
      toast.success('Session completed!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to stop session');
    }
  };

  const handleKick = async (record: AttendanceRecord) => {
    if (!window.confirm(`Remove ${record.student.full_name} from attendance?`)) return;
    try {
      await attendanceService.kickStudent(record.id);
      const updated = await attendanceService.getSessionRecords(sessionId!);
      setRecords(updated);
      toast.success(`${record.student.full_name} removed`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove student');
    }
  };

  const handleReset = () => {
    setSessionId(null);
    setSessionStatus('idle');
    setStartedAt(null);
    setElapsed(0);
    setRecords([]);
    setCurrentToken(null);
    setQrVisible(true);
  };

  const activeRecords = records.filter(r => r.status === 'present');
  const removedRecords = records.filter(r => r.status === 'removed');
  const selectedClass = classes.find(c => c.id === selectedClassId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance.</h1>
            <div className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-slate-200">
              Live
            </div>
          </div>
          <p className="text-sm text-slate-400 font-medium">Start a class session and track student attendance via QR code</p>
        </div>
        {sessionStatus === 'completed' && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-primary-200 transition-all active:scale-95 text-sm"
          >
            New Session
          </button>
        )}
      </div>

      {/* Setup Panel - shown when idle */}
      {sessionStatus === 'idle' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5 max-w-lg">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Create Attendance Session</h2>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Date</label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
              />
            </div>
          </div>

          {/* Class Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Class</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 appearance-none cursor-pointer text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
              >
                <option value="">Select a class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          <button
            onClick={handleCreateSession}
            disabled={!selectedClassId}
            className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md shadow-primary-200 text-sm flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Session
          </button>
        </div>
      )}

      {/* Session Panel - shown when pending or active */}
      {(sessionStatus === 'pending' || sessionStatus === 'active' || sessionStatus === 'completed') && (
        <div className="space-y-6">
          {/* Session Info Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  sessionStatus === 'active' ? 'bg-emerald-50 text-emerald-600' :
                  sessionStatus === 'completed' ? 'bg-slate-100 text-slate-500' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {sessionStatus === 'active' ? <Play size={20} /> :
                   sessionStatus === 'completed' ? <Square size={20} /> :
                   <Clock size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">{selectedClass?.name}</h2>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                      sessionStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      sessionStatus === 'completed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {sessionStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {new Date(sessionDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Timer */}
                {sessionStatus === 'active' && (
                  <div className="bg-slate-900 text-white px-4 py-2 rounded-xl font-mono text-lg font-bold tracking-wider">
                    {formatTime(elapsed)}
                  </div>
                )}

                {/* Controls */}
                {sessionStatus === 'pending' && (
                  <button
                    onClick={handleStart}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-sm"
                  >
                    <Play size={16} />
                    Start Session
                  </button>
                )}

                {sessionStatus === 'active' && (
                  <>
                    <button
                      onClick={() => setQrVisible(!qrVisible)}
                      className={`flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl text-sm transition-all active:scale-95 border ${
                        qrVisible
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100'
                      }`}
                    >
                      {qrVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                      {qrVisible ? 'Hide QR' : 'Show QR'}
                    </button>
                    <button
                      onClick={handleStop}
                      className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-sm"
                    >
                      <Square size={16} />
                      Stop Session
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* QR Code Panel */}
            {sessionStatus === 'active' && (
              <div className="lg:col-span-1">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <QrCode size={18} className="text-primary-600" />
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">Scan to Attend</h3>
                  </div>

                  {qrVisible && currentToken ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 inline-block">
                        <QRCodeSVG
                          value={getQrValue()}
                          size={200}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Refreshing every 2 seconds
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                        <EyeOff size={28} />
                      </div>
                      <p className="text-sm text-slate-400 font-bold">QR Code Hidden</p>
                      <p className="text-xs text-slate-300">Students cannot join right now</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Students Grid */}
            <div className={sessionStatus === 'active' ? 'lg:col-span-2' : 'lg:col-span-3'}>
              {/* Stats */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-xs font-bold text-slate-600">{activeRecords.length} Present</span>
                </div>
                {removedRecords.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-rose-500 rounded-full" />
                    <span className="text-xs font-bold text-slate-600">{removedRecords.length} Removed</span>
                  </div>
                )}
              </div>

              {/* Student Cards Grid */}
              {records.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-16 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                    <Users size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-400 mb-1">No Students Yet</h3>
                  <p className="text-sm text-slate-300 font-medium">
                    {sessionStatus === 'active' ? 'Waiting for students to scan the QR code...' : 'Start the session to begin tracking attendance'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {records.map((record) => (
                    <StudentCard
                      key={record.id}
                      record={record}
                      sessionActive={sessionStatus === 'active'}
                      onKick={() => handleKick(record)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Student Card Component
const StudentCard = ({
  record,
  sessionActive,
  onKick
}: {
  record: AttendanceRecord;
  sessionActive: boolean;
  onKick: () => void;
}) => {
  const [liveElapsed, setLiveElapsed] = useState(0);

  useEffect(() => {
    if (record.status === 'present' && !record.time_left && sessionActive) {
      const interval = setInterval(() => {
        const joined = new Date(record.time_joined).getTime();
        setLiveElapsed(Math.floor((Date.now() - joined) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [record.status, record.time_left, record.time_joined, sessionActive]);

  const isRemoved = record.status === 'removed';
  const isFinished = !!record.time_left;

  const formatCardTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatHours = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const joinTime = new Date(record.time_joined).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`bg-white border rounded-2xl p-4 transition-all ${
      isRemoved ? 'border-rose-200 bg-rose-50/50 opacity-60' : 'border-slate-200 hover:border-slate-300'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm shrink-0 ${
            isRemoved ? 'bg-rose-200 text-rose-700' : 'bg-slate-900 text-white'
          }`}>
            {record.student.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-sm truncate">{record.student.full_name}</div>
            <div className="text-[10px] text-slate-400 font-medium">
              {record.student.serial_id || record.student.email?.split('@')[0] || 'N/A'}
            </div>
          </div>
        </div>
        {!isRemoved && sessionActive && (
          <button
            onClick={onKick}
            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0"
            title="Remove student"
          >
            <UserX size={15} />
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Joined</span>
          <span className="font-bold text-slate-700">{joinTime}</span>
        </div>
        {isFinished ? (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Left</span>
              <span className="font-bold text-slate-700">
                {new Date(record.time_left!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Duration</span>
              <span className={`font-bold ${isRemoved ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatHours(record.hours_attended)}
              </span>
            </div>
          </>
        ) : sessionActive ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Duration</span>
            <span className="font-bold text-emerald-600 font-mono">{formatCardTime(liveElapsed)}</span>
          </div>
        ) : null}
      </div>

      {isRemoved && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-500 font-bold">
          <AlertCircle size={12} />
          Removed
        </div>
      )}
    </div>
  );
};

export default Attendance;
