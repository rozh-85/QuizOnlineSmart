interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">Quiz Progress</span>
          <span className="text-xs font-bold text-slate-400">Question {current} of {total}</span>
        </div>
        <span className="text-xs font-black text-slate-900">{Math.round(percentage)}% Complete</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div 
          className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
