import {
  Info,
  Link as LinkIcon,
  KeyRound,
  Trash2,
  SmartphoneNfc,
  UserMinus
} from 'lucide-react';

interface StudentTableRowProps {
  student: any;
  selectedClassId: string;
  onViewInfo: (student: any) => void;
  onAssignClass: (student: any) => void;
  onChangePassword: (student: any) => void;
  onDelete: (student: any) => void;
  onResetDevice: (student: any) => void;
  onRemoveFromClass: (studentId: string) => void;
}

const StudentTableRow = ({
  student,
  selectedClassId,
  onViewInfo,
  onAssignClass,
  onChangePassword,
  onDelete,
  onResetDevice,
  onRemoveFromClass,
}: StudentTableRowProps) => {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {student.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{student.full_name}</div>
            <div className="text-[10px] text-slate-400 font-medium">{student.email || `${student.serial_id}@kimya.com`}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 border border-slate-200">
          {student.serial_id || 'N/A'}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex justify-center">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
            student.device_lock_active 
              ? 'bg-rose-50 text-rose-600 border border-rose-100' 
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${student.device_lock_active ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            {student.device_lock_active ? 'Locked' : 'Free'}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-1">
          {selectedClassId !== 'all' && (
            <button 
              onClick={() => onRemoveFromClass(student.id)}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              title="Remove from class"
            >
              <UserMinus size={15} />
            </button>
          )}
          <button 
            onClick={() => onViewInfo(student)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
            title="View details"
          >
            <Info size={15} />
          </button>
          <button 
            onClick={() => onAssignClass(student)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
            title="Assign to class"
          >
            <LinkIcon size={15} />
          </button>
          <button 
            onClick={() => onChangePassword(student)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
            title="Change password"
          >
            <KeyRound size={15} />
          </button>
          <button 
            onClick={() => onDelete(student)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
            title="Delete student"
          >
            <Trash2 size={15} />
          </button>
          <button 
            onClick={() => onResetDevice(student)}
            disabled={!student.device_lock_active}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
            title="Reset device"
          >
            <SmartphoneNfc size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default StudentTableRow;
