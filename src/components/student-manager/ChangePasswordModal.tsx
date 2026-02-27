import { useState } from 'react';
import { KeyRound, Eye, EyeOff, AlertCircle, Loader2, X } from 'lucide-react';
import { FormField } from '../ui';

interface ChangePasswordModalProps {
  student: any;
  onClose: () => void;
  onSubmit: (studentId: string, newPassword: string) => Promise<void>;
}

const ChangePasswordModal = ({ student, onClose, onSubmit }: ChangePasswordModalProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changingPassword) return;
    setChangingPassword(true);
    try {
      await onSubmit(student.id, newPassword);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <KeyRound size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Change Password</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{student.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="New Password">
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                className="w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white rounded-xl outline-none font-bold tracking-widest text-sm transition-all focus:ring-4 focus:ring-violet-50"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          <FormField label="Confirm Password">
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className={`w-full px-4 py-3 pr-10 bg-slate-50 border focus:bg-white rounded-xl outline-none font-bold tracking-widest text-sm transition-all focus:ring-4 ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-50'
                    : 'border-slate-200 focus:border-violet-500 focus:ring-violet-50'
                }`}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle size={10} /> Passwords do not match
              </p>
            )}
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
              className="flex-1 py-3 bg-violet-600 text-white font-bold rounded-xl shadow-md shadow-violet-200 text-sm flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-violet-700 disabled:opacity-50"
            >
              {changingPassword ? (
                <><Loader2 className="animate-spin" size={14} /> Updating...</>
              ) : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
