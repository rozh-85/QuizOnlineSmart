import { X, AlertTriangle } from 'lucide-react';

interface StopSessionModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  studentCount: number;
}

const StopSessionModal = ({ onConfirm, onCancel, studentCount }: StopSessionModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-4">
            <AlertTriangle size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">Stop Session?</h3>
          <p className="text-sm text-slate-500 font-medium mb-1">
            All student timers will be finalized.
          </p>
          {studentCount > 0 && (
            <p className="text-xs text-slate-400">
              {studentCount} student{studentCount !== 1 ? 's' : ''} currently present
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md shadow-rose-200 transition-all active:scale-95"
          >
            Stop Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default StopSessionModal;
