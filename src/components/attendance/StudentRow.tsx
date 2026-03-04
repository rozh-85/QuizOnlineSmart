import { useState, useEffect } from 'react';
import { UserX, AlertCircle } from 'lucide-react';

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

interface StudentRowProps {
  record: AttendanceRecord;
  index: number;
  sessionActive: boolean;
  onKick: () => void;
}

const StudentRow = ({ record, index, sessionActive, onKick }: StudentRowProps) => {
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

  const formatRowTime = (seconds: number): string => {
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

  const durationDisplay = isFinished
    ? formatHours(record.hours_attended)
    : sessionActive
      ? formatRowTime(liveElapsed)
      : '—';

  return (
    <tr className={`transition-colors ${
      isRemoved ? 'bg-rose-50/50 opacity-60' : 'hover:bg-slate-50/60'
    }`}>
      <td className="px-4 py-3 text-xs font-bold text-slate-400 w-10">{index}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
            isRemoved ? 'bg-rose-200 text-rose-700' : 'bg-slate-900 text-white'
          }`}>
            {record.student.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="font-bold text-sm text-slate-900 truncate">{record.student.full_name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs font-medium text-slate-500">
        {record.student.serial_id || record.student.email?.split('@')[0] || 'N/A'}
      </td>
      <td className="px-4 py-3 text-xs font-bold text-slate-700">{joinTime}</td>
      <td className="px-4 py-3">
        <span className={`text-xs font-bold font-mono ${
          isRemoved ? 'text-rose-600' : 'text-emerald-600'
        }`}>
          {durationDisplay}
        </span>
      </td>
      <td className="px-4 py-3">
        {isRemoved ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
            <AlertCircle size={10} />
            Removed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            Present
          </span>
        )}
      </td>
      {sessionActive && (
        <td className="px-4 py-3 text-end">
          {!isRemoved && (
            <button
              onClick={onKick}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-all"
              title="Remove student"
            >
              <UserX size={14} />
              Remove
            </button>
          )}
        </td>
      )}
    </tr>
  );
};

export default StudentRow;
export type { AttendanceRecord };
