import { ShieldCheck, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentSuccessModalProps {
  studentInfo: {
    fullName: string;
    serialId: string;
    pin: string;
  };
  onClose: () => void;
}

const StudentSuccessModal = ({ studentInfo, onClose }: StudentSuccessModalProps) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 animate-scale-in relative flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
           <ShieldCheck size={32} />
        </div>

        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">{studentInfo.fullName}</h3>
        <p className="text-xs text-slate-400 font-medium mb-6">Account created successfully</p>
        
        <div className="w-full space-y-4 mb-8">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Login Email</div>
            <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center justify-between">
               <span className="text-sm font-bold text-slate-900">{studentInfo.serialId}@kimya.com</span>
               <button onClick={() => copyToClipboard(`${studentInfo.serialId}@kimya.com`, 'Email')} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-400 hover:text-slate-900 border border-slate-200 transition-all active:scale-90">
                <Copy size={12} />
               </button>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">PIN</div>
            <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center justify-between">
               <span className="text-lg font-black text-slate-900 tracking-widest">{studentInfo.pin}</span>
               <button onClick={() => copyToClipboard(studentInfo.pin, 'PIN')} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-400 hover:text-slate-900 border border-slate-200 transition-all active:scale-90">
                <Copy size={12} />
               </button>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md shadow-primary-200 text-sm transition-all active:scale-95 hover:bg-primary-700"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default StudentSuccessModal;
