import { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  icon?: ReactNode;
  iconBg?: string;          // e.g. 'bg-rose-50 text-rose-500'
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'rose' | 'amber' | 'primary';
}

const CONFIRM_COLORS = {
  rose: 'bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-100',
  amber: 'bg-amber-600 hover:bg-amber-700 shadow-xl shadow-amber-100',
  primary: 'bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-100',
};

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  icon,
  iconBg = 'bg-rose-50 text-rose-500',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'rose',
}: ConfirmDialogProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
      <div className="bg-white w-full max-w-[340px] rounded-[2rem] shadow-2xl p-8 animate-scale-in text-center">
        {icon && (
          <div className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center mx-auto mb-6`}>
            {icon}
          </div>
        )}

        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{title}</h3>
        <div className="text-xs text-slate-400 font-bold leading-relaxed mb-8 px-2">{message}</div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={onConfirm}
            className={`w-full py-4 text-white font-black rounded-2xl text-sm transition-all active:scale-95 ${CONFIRM_COLORS[confirmColor]}`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-slate-400 hover:text-slate-900 font-black text-sm transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
