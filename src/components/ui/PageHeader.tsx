import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  badge?: string;
  badgeColor?: string;
  subtitle?: string;
  action?: ReactNode;
}

const PageHeader = ({
  title,
  badge,
  badgeColor = 'bg-slate-100 text-slate-600 border-slate-200',
  subtitle,
  action,
}: PageHeaderProps) => (
  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
        {badge && (
          <div
            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${badgeColor}`}
          >
            {badge}
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-slate-400 font-medium">{subtitle}</p>
      )}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

export default PageHeader;
