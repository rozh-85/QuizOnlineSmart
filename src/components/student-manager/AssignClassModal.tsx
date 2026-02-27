import { Link as LinkIcon, ChevronRight, X } from 'lucide-react';

interface AssignClassModalProps {
  student: any;
  classes: any[];
  onAssign: (classId: string) => void;
  onClose: () => void;
}

const AssignClassModal = ({ student, classes, onAssign, onClose }: AssignClassModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <LinkIcon size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Assign Class</h3>
              <p className="text-[10px] text-slate-400 font-medium">Choose a class for {student?.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2 max-h-[320px] overflow-auto">
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => onAssign(c.id)}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-primary-50 hover:text-primary-700 rounded-xl transition-all font-bold text-sm text-slate-700 border border-slate-200 hover:border-primary-200 group/item"
            >
              {c.name}
              <ChevronRight size={14} className="text-slate-300 group-hover/item:text-primary-500 group-hover/item:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
        
        <button onClick={onClose} className="w-full mt-4 py-2.5 text-slate-400 hover:text-slate-900 font-bold text-sm transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AssignClassModal;
