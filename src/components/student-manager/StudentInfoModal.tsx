import { User, AlertCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StudentInfoModalProps {
  student: any;
  onClose: () => void;
}

const StudentInfoModal = ({ student, onClose }: StudentInfoModalProps) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 animate-scale-in relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
          <X size={18} />
        </button>
        
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 mb-5">
           <User size={28} />
        </div>

        <h3 className="text-xl font-black text-slate-900 tracking-tight text-center mb-1">{student.full_name}</h3>
        <p className="text-xs text-slate-400 font-medium mb-6">{t('studentManager.studentProfile')}</p>

        <div className="w-full space-y-4 mb-6">
          <div className="text-center">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">{t('studentManager.email')}</label>
            <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm">
              {student.serial_id || student.email?.split('@')[0] || 'N/A'}@kimya.com
            </div>
          </div>

          <div className="text-center">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">{t('studentManager.pin')}</label>
            <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-black text-slate-900 text-lg tracking-widest">
              {student.pin_display || '••••'}
            </div>
            {!student.pin_display && (
              <div className="mt-2 flex items-center gap-1.5 justify-center">
                <AlertCircle size={10} className="text-slate-300" />
                <p className="text-[10px] text-slate-300 font-medium">{t('studentManager.pinNotAvailable')}</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-sm transition-all active:scale-95 hover:bg-slate-800"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
};

export default StudentInfoModal;
