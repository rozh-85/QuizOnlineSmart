import { Clock } from 'lucide-react';

interface ReportSummaryCardsProps {
  totalHours: number;
  presentHours: number;
  absentHours: number;
  formatDuration: (hours: number) => string;
}

const ReportSummaryCards = ({ totalHours, presentHours, absentHours, formatDuration }: ReportSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Clock size={18} className="text-slate-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Hours</p>
            <p className="text-xl font-black text-slate-900">{formatDuration(totalHours)}</p>
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
            <p className="text-xl font-black text-emerald-700">{formatDuration(presentHours)}</p>
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
            <p className="text-xl font-black text-rose-700">{formatDuration(absentHours)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSummaryCards;
