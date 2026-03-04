import { Settings2, ChevronUp, ChevronDown, Building2, GraduationCap, Type, Calendar, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui';
import type { ExamSettings } from '../../types/examBuilder';

const HeaderField = ({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  icon: any;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-100">
      <Icon size={14} />
    </div>
    <div className="flex-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 px-2 rounded-lg border-2 border-slate-100 focus:border-primary-400 outline-none transition-all text-xs font-semibold text-slate-700 bg-white"
      />
    </div>
  </div>
);

interface ExamSettingsPanelProps {
  settings: ExamSettings;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  updateSetting: <K extends keyof ExamSettings>(key: K, value: ExamSettings[K]) => void;
}

const ExamSettingsPanel = ({ settings, settingsOpen, setSettingsOpen, updateSetting }: ExamSettingsPanelProps) => {
  const { t } = useTranslation();
  return (
    <Card className="!p-4 shadow-sm border border-slate-100 mb-4">
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="w-full flex items-center justify-between mb-0"
      >
        <div className="flex items-center gap-2">
          <Settings2 size={15} className="text-primary-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {t('examBuilder.examSettings')}
          </span>
        </div>
        {settingsOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {settingsOpen && (
        <div className="mt-4 space-y-4">
          {/* Header Toggle */}
          <div>
            <button
              onClick={() => updateSetting('header_enabled', !settings.header_enabled)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${
                settings.header_enabled
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <span className={`text-xs font-black ${settings.header_enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                {t('examBuilder.examHeader')}
              </span>
              <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                settings.header_enabled ? 'bg-emerald-500' : 'bg-slate-200'
              }`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  settings.header_enabled ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'translate-x-0'
                }`} />
              </div>
            </button>
          </div>

          {settings.header_enabled && (
            <div className="space-y-3 pl-1">
              <HeaderField icon={Building2} label={t('examBuilder.college')} value={settings.college} onChange={(v) => updateSetting('college', v)} placeholder="e.g. College of Science" />
              <HeaderField icon={GraduationCap} label={t('examBuilder.department')} value={settings.department} onChange={(v) => updateSetting('department', v)} placeholder="e.g. Chemistry Dept." />
              <HeaderField icon={Type} label={t('examBuilder.subject')} value={settings.subject} onChange={(v) => updateSetting('subject', v)} placeholder="e.g. Organic Chemistry" />
              <HeaderField icon={Calendar} label={t('examBuilder.date')} value={settings.date} onChange={(v) => updateSetting('date', v)} placeholder="e.g. 2025-02-17" type="date" />
              <HeaderField icon={Clock} label={t('examBuilder.timeAllowed')} value={settings.time_allowed} onChange={(v) => updateSetting('time_allowed', v)} placeholder="e.g. 2 Hours" />
              <p className="text-[10px] text-slate-400 font-medium italic">
                {t('examBuilder.settingsAutoSave')}
              </p>
            </div>
          )}

          {/* Footer Toggle */}
          <div>
            <button
              onClick={() => updateSetting('footer_enabled', !settings.footer_enabled)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${
                settings.footer_enabled
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <span className={`text-xs font-black ${settings.footer_enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                {t('examBuilder.pageFooter')}
              </span>
              <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                settings.footer_enabled ? 'bg-emerald-500' : 'bg-slate-200'
              }`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  settings.footer_enabled ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'translate-x-0'
                }`} />
              </div>
            </button>
            {settings.footer_enabled && (
              <p className="text-[10px] text-slate-400 font-medium italic mt-2 pl-1">
                {t('examBuilder.enableHeadersFooters')}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ExamSettingsPanel;
