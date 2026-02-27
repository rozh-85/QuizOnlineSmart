import { Users } from 'lucide-react';

interface SessionCardProps {
  session: any;
  onClick: () => void;
  formatDate: (dateStr: string) => string;
  formatTime: (dateStr: string | null) => string;
  formatDuration: (hours: number) => string;
  getSessionEndTime: (session: any) => string | null;
  getSessionDurationHours: (session: any) => number;
}

const SessionCard = ({
  session, onClick, formatDate, formatTime, formatDuration,
  getSessionEndTime, getSessionDurationHours
}: SessionCardProps) => {
  const endTime = getSessionEndTime(session);
  const duration = getSessionDurationHours(session);
  const presentCount = (session.records || []).filter((r: any) => r.status === 'present').length;

  return (
    <button
      onClick={onClick}
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
};

export default SessionCard;
