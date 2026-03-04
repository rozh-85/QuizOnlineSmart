import { Clock } from 'lucide-react';

interface ReportSummaryCardsProps {
  totalHours: number;
  presentHours: number;
  absentHours: number;
  formatDuration: (hours: number) => string;
}

const ReportSummaryCards = ({ totalHours, presentHours, absentHours, formatDuration }: ReportSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Clock size={14} className="text-slate-600" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Hours</p>
            <p className="text-sm font-black text-slate-900 leading-tight">{formatDuration(totalHours)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-emerald-200 rounded-xl shadow-sm px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <Clock size={14} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Present</p>
            <p className="text-sm font-black text-emerald-700 leading-tight">{formatDuration(presentHours)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-rose-200 rounded-xl shadow-sm px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
            <Clock size={14} className="text-rose-600" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">Absent</p>
            <p className="text-sm font-black text-rose-700 leading-tight">{formatDuration(absentHours)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSummaryCards;
