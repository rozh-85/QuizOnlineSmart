import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  color?: string;            // bg color class for the icon container, e.g. 'bg-blue-50'
  borderColor?: string;      // optional border color override e.g. 'border-emerald-200'
  valueColor?: string;       // optional value text color e.g. 'text-emerald-700'
  labelColor?: string;       // optional label text color
}

const StatCard = ({
  icon,
  value,
  label,
  color = 'bg-slate-50',
  borderColor = 'border-slate-200',
  valueColor = 'text-slate-900',
  labelColor = 'text-slate-400',
}: StatCardProps) => (
  <div className={`bg-white border ${borderColor} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow`}>
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
      <div className={`text-2xl font-black ${valueColor} leading-none`}>{value}</div>
    </div>
    <div className={`text-[10px] font-bold uppercase tracking-widest ${labelColor}`}>{label}</div>
  </div>
);

export default StatCard;
