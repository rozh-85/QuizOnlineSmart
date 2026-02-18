import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  /** Use dashed border style (default true) */
  dashed?: boolean;
}

const EmptyState = ({
  icon,
  title,
  subtitle,
  action,
  className = '',
  dashed = true,
}: EmptyStateProps) => (
  <div
    className={`bg-white rounded-2xl py-16 flex flex-col items-center justify-center text-center px-6 ${
      dashed ? 'border-2 border-dashed border-slate-200' : 'border border-slate-200 shadow-sm'
    } ${className}`}
  >
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-400 mb-1">{title}</h3>
    {subtitle && <p className="text-sm text-slate-300 font-medium">{subtitle}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export default EmptyState;
