import { useState, useEffect } from 'react';
import {
  ChevronDown,
  Play,
  Square,
  Eye,
  EyeOff,
  Clock,
  Users,
  QrCode,
  GraduationCap,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { classApi } from '../../api/classApi';
import { attendanceApi } from '../../api/attendanceApi';
import { authApi } from '../../api/authApi';
import { lectureApi } from '../../api/lectureApi';
import toast from 'react-hot-toast';
import { PageHeader, FormField, EmptyState } from '../../components/ui';
import { StopSessionModal, StudentRow } from '../../components/attendance';
import type { AttendanceRecord } from '../../components/attendance';
import { useTimer } from '../../hooks/useTimer';
import { useAttendanceSession, useQrTokenRefresh } from '../../hooks/useAttendance';
import { formatTime } from '../../utils/format';

type SessionStatus = 'idle' | 'pending' | 'active' | 'completed';

const Attendance = () => {
  const { t } = useTranslation();
  // Core state
  const [classes, setClasses] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const sessionDate = new Date().toISOString().split('T')[0];
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const [startedAt, setStartedAt] = useState<Date | null>(null);

  // QR state
  const [qrVisible, setQrVisible] = useState(true);

  // Stop modal
  const [showStopModal, setShowStopModal] = useState(false);

  // Delegate to hooks
  const { elapsed, reset: resetTimer } = useTimer(sessionStatus === 'active', startedAt);
  const { records, setRecords } = useAttendanceSession(sessionId, sessionStatus);
  const { currentToken, setCurrentToken } = useQrTokenRefresh(sessionId, sessionStatus, qrVisible);

  // Initialize: fetch teacher info + classes + restore active session
  useEffect(() => {
    const init = async () => {
      try {
        const user = await authApi.getCurrentUser();
        if (user) {
          setTeacherId(user.id);

          const activeSession = await attendanceApi.getActiveSessionForTeacher(user.id);
          if (activeSession) {
            setSessionId(activeSession.id);
            setSelectedClassId(activeSession.class_id);
            if (activeSession.lecture_id) setSelectedLectureId(activeSession.lecture_id);

            if (activeSession.status === 'active') {
              setSessionStatus('active');
              setStartedAt(new Date(activeSession.started_at));
              setQrVisible(true);
            } else if (activeSession.status === 'pending') {
              setSessionStatus('pending');
            }
          }
        }
        const [cls, lecs] = await Promise.all([
          classApi.getAll(),
          lectureApi.getAll()
        ]);
        setClasses(cls);
        setLectures(lecs);
      } catch (e) {
        toast.error(t('attendance.failedToLoadData'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

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
      toast.error(t('attendance.pleaseSelectClass'));
      return;
    }
    try {
      const session = await attendanceApi.createSession(selectedClassId, teacherId, sessionDate, selectedLectureId || undefined);
      setSessionId(session.id);
      setSessionStatus('pending');
      toast.success(t('attendance.sessionCreated'));
    } catch (e: any) {
      toast.error(e.message || t('attendance.failedToCreateSession'));
    }
  };

  const handleStart = async () => {
    if (!sessionId) return;
    try {
      const session = await attendanceApi.startSession(sessionId);
      setSessionStatus('active');
      setStartedAt(new Date(session.started_at));
      resetTimer();
      setQrVisible(true);
      toast.success(t('attendance.sessionStarted'));
    } catch (e: any) {
      toast.error(e.message || t('attendance.failedToStartSession'));
    }
  };

  const handleStop = async () => {
    if (!sessionId) return;
    try {
      await attendanceApi.stopSession(sessionId);
      setSessionStatus('completed');
      setQrVisible(false);
      setCurrentToken(null);
      setShowStopModal(false);
      // Hooks auto-cleanup via deps; fetch final records
      const finalRecords = await attendanceApi.getSessionRecords(sessionId);
      setRecords(finalRecords);
      toast.success(t('attendance.sessionCompleted'));
    } catch (e: any) {
      toast.error(e.message || t('attendance.failedToStopSession'));
    }
  };

  const handleKick = async (record: AttendanceRecord) => {
    if (!window.confirm(t('attendance.removeConfirm', { name: record.student.full_name }))) return;
    try {
      await attendanceApi.kickStudent(record.id);
      const updated = await attendanceApi.getSessionRecords(sessionId!);
      setRecords(updated);
      toast.success(t('attendance.studentRemoved', { name: record.student.full_name }));
    } catch (e: any) {
      toast.error(e.message || t('attendance.failedToRemoveStudent'));
    }
  };

  const handleReset = () => {
    setSessionId(null);
    setSessionStatus('idle');
    setStartedAt(null);
    resetTimer();
    setRecords([]);
    setCurrentToken(null);
    setQrVisible(true);
  };

  const activeRecords = records.filter(r => r.status === 'present');
  const removedRecords = records.filter(r => r.status === 'removed');
  const selectedClass = classes.find(c => c.id === selectedClassId);

  if (loading) {
    return (
      <div className="animate-fade-in w-full">
        {/* Skeleton Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="w-40 h-7 rounded-lg bg-slate-200/60 animate-pulse" />
            <div className="w-64 h-4 rounded bg-slate-200/60 animate-pulse" />
          </div>
        </div>
        {/* Skeleton Setup Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 max-w-lg animate-pulse">
          <div className="w-56 h-6 rounded bg-slate-200/60" />
          <div className="space-y-3">
            <div className="w-20 h-3 rounded bg-slate-200/60" />
            <div className="h-11 rounded-xl bg-slate-200/60" />
          </div>
          <div className="space-y-3">
            <div className="w-16 h-3 rounded bg-slate-200/60" />
            <div className="h-11 rounded-xl bg-slate-200/60" />
          </div>
          <div className="h-11 w-40 rounded-xl bg-slate-200/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full">
      {/* Header */}
      <PageHeader
        title={t('attendance.title')}
        badge={t('attendance.live')}
        subtitle={t('attendance.subtitle')}
        action={
          sessionStatus === 'completed' ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-primary-200 transition-all active:scale-95 text-sm"
            >
              {t('attendance.newSession')}
            </button>
          ) : undefined
        }
      />

      {/* Setup Panel - shown when idle */}
      {sessionStatus === 'idle' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5 max-w-lg">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('attendance.createAttendanceSession')}</h2>

          {/* Lecture Selector (Optional) */}
          <FormField label={<>{t('attendance.lecture')} <span className="text-slate-300">({t('attendance.optional')})</span></>}>
            <div className="relative">
              <GraduationCap className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedLectureId}
                onChange={(e) => setSelectedLectureId(e.target.value)}
                className="w-full ps-10 pe-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 appearance-none cursor-pointer text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
              >
                <option value="">{t('attendance.noLecture')}</option>
                {lectures.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
              <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </FormField>

          {/* Class Selector */}
          <FormField label={t('attendance.class')}>
            <div className="relative">
              <Users className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full ps-10 pe-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 appearance-none cursor-pointer text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
              >
                <option value="">{t('attendance.selectClass')}</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </FormField>

          <button
            onClick={handleCreateSession}
            disabled={!selectedClassId}
            className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md shadow-primary-200 text-sm flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('attendance.createSession')}
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
                    {t('attendance.startSession')}
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
                      {qrVisible ? t('attendance.hideQR') : t('attendance.showQR')}
                    </button>
                    <button
                      onClick={() => setShowStopModal(true)}
                      className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-sm"
                    >
                      <Square size={16} />
                      {t('attendance.stopSession')}
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
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">{t('attendance.scanToAttend')}</h3>
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
                        {t('attendance.refreshingEvery5s')}
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                        <EyeOff size={28} />
                      </div>
                      <p className="text-sm text-slate-400 font-bold">{t('attendance.qrCodeHidden')}</p>
                      <p className="text-xs text-slate-300">{t('attendance.studentsCannotJoin')}</p>
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
                  <span className="text-xs font-bold text-slate-600">{activeRecords.length} {t('attendance.present')}</span>
                </div>
                {removedRecords.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-rose-500 rounded-full" />
                    <span className="text-xs font-bold text-slate-600">{removedRecords.length} {t('attendance.removed')}</span>
                  </div>
                )}
              </div>

              {/* Student Table */}
              {records.length === 0 ? (
                <EmptyState
                  icon={<Users size={28} />}
                  title={t('attendance.noStudentsYet')}
                  subtitle={sessionStatus === 'active' ? t('attendance.waitingForStudents') : t('attendance.startToBeginTracking')}
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <th className="text-start text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">#</th>
                        <th className="text-start text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">{t('attendance.studentCol')}</th>
                        <th className="text-start text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">{t('attendance.idCol')}</th>
                        <th className="text-start text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">{t('attendance.joinedCol')}</th>
                        <th className="text-start text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">{t('attendance.durationCol')}</th>
                        <th className="text-start text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">{t('attendance.statusCol')}</th>
                        {sessionStatus === 'active' && (
                          <th className="text-end text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">{t('attendance.actionCol')}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((record, index) => (
                        <StudentRow
                          key={record.id}
                          record={record}
                          index={index + 1}
                          sessionActive={sessionStatus === 'active'}
                          onKick={() => handleKick(record)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Stop Session Modal */}
      {showStopModal && (
        <StopSessionModal
          onConfirm={handleStop}
          onCancel={() => setShowStopModal(false)}
          studentCount={activeRecords.length}
        />
      )}
    </div>
  );
};



export default Attendance;
