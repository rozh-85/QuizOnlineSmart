import { useState } from 'react';
import { AtSign, ChevronDown, Loader2, X } from 'lucide-react';
import { FormField } from '../ui';

interface CreateStudentModalProps {
  classes: any[];
  onClose: () => void;
  onSubmit: (data: { fullName: string; serialId: string; pin: string; classId: string }) => Promise<void>;
}

const CreateStudentModal = ({ classes, onClose, onSubmit }: CreateStudentModalProps) => {
  const [creating, setCreating] = useState(false);
  const [newStudent, setNewStudent] = useState({
    fullName: '',
    serialId: '',
    pin: '',
    classId: ''
  });

  const handleNameChange = (name: string) => {
    const updates: any = { fullName: name };
    if (!newStudent.serialId) {
      const cleanName = name.replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0, 3);
      if (cleanName.length >= 2) {
        updates.serialId = `${cleanName}${Math.floor(100 + Math.random() * 900)}`;
      }
    }
    setNewStudent({ ...newStudent, ...updates });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      await onSubmit(newStudent);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">New Student</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Create a new student account</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>
         
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Full Name">
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none font-medium text-slate-900 text-sm transition-all focus:ring-4 focus:ring-primary-50"
              placeholder="e.g. John Doe"
              value={newStudent.fullName}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </FormField>
          
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Serial ID">
              <div className="relative">
                <AtSign size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  className="w-full ps-9 pe-3 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl outline-none font-bold text-sm transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-50 placeholder:text-slate-300"
                  placeholder="ID"
                  value={newStudent.serialId}
                  onChange={(e) => setNewStudent({...newStudent, serialId: e.target.value.toLowerCase()})}
                />
              </div>
            </FormField>
            <FormField label="PIN">
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none font-bold tracking-widest text-sm text-center transition-all focus:ring-4 focus:ring-primary-50"
                placeholder="••••"
                value={newStudent.pin}
                onChange={(e) => setNewStudent({...newStudent, pin: e.target.value})}
              />
            </FormField>
          </div>

          <FormField label="Assign to Class (optional)">
            <div className="relative">
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none font-medium text-slate-700 appearance-none cursor-pointer text-sm transition-all focus:ring-4 focus:ring-primary-50"
                value={newStudent.classId}
                onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}
              >
                <option value="">No class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={14} />
            </div>
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={creating}
              className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md shadow-primary-200 text-sm flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-primary-700 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Creating...
                </>
              ) : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStudentModal;
