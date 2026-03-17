import { BookOpen, HelpCircle, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StatsRowProps {
  lectureCount: number;
  questionCount: number;
  sectionCount: number;
}

const StatsRow = ({ lectureCount, questionCount, sectionCount }: StatsRowProps) => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: BookOpen,
      value: lectureCount,
      label: t('stats.lectures'),
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: HelpCircle,
      value: questionCount,
      label: t('stats.questions'),
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      icon: Layers,
      value: sectionCount,
      label: t('student.sections'),
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 relative z-10 -mt-7">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {stats.map(({ icon: Icon, value, label, iconBg, iconColor }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-100 shadow-md shadow-slate-200/60 px-2 sm:px-4 py-3.5 flex flex-col items-center text-center gap-1.5"
          >
            <div
              className={`w-9 h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}
            >
              <Icon size={17} />
            </div>
            <div className="text-xl font-extrabold text-slate-900 leading-none">
              {value}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 leading-tight">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsRow;
