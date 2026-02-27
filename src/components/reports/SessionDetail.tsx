import { ArrowLeft, Users } from 'lucide-react';

interface SessionDetailProps {
  session: any;
  onBack: () => void;
  formatDuration: (hours: number) => string;
  formatTime: (dateStr: string | null) => string;
}

const SessionDetail = ({ session, onBack, formatDuration, formatTime }: SessionDetailProps) => {
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

export default SessionDetail;
