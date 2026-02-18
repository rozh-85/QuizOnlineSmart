import { UserPlus, Pencil } from 'lucide-react';
import { Button, Card, Input, TextArea } from '../ui';

interface ManualFAQFormProps {
  showManualForm: boolean;
  setShowManualForm: (show: boolean) => void;
  manualData: { id: string; question: string; answer: string; publish: boolean };
  setManualData: (data: { id: string; question: string; answer: string; publish: boolean }) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ManualFAQForm = ({
  showManualForm, setShowManualForm,
  manualData, setManualData, onSubmit,
}: ManualFAQFormProps) => {
  if (!showManualForm) {
    return (
      <div className="flex justify-end">
        <Button
          onClick={() => setShowManualForm(true)}
          className="rounded-xl h-10 px-5 bg-indigo-600 hover:bg-indigo-700 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"
        >
          <UserPlus size={14} />
          <span>{manualData.id ? 'Edit FAQ' : 'Add Manual FAQ'}</span>
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-8 border-slate-200 bg-white shadow-2xl rounded-3xl animate-in fade-in slide-in-from-top-2 border-b-8 border-b-indigo-600">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            {manualData.id ? 'Edit FAQ Item' : 'Add FAQ Entry'}
          </h3>
          <p className="text-xs font-medium text-slate-500">
            {manualData.id ? 'Update the public explanation.' : 'Create a public question and answer for all students.'}
          </p>
        </div>
        <button
          onClick={() => { setShowManualForm(false); setManualData({ id: '', question: '', answer: '', publish: true }); }}
          className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Student Question</label>
          <Input
            placeholder="e.g. How do I calculate the variance?"
            value={manualData.question}
            onChange={e => setManualData({ ...manualData, question: e.target.value })}
            className="bg-slate-50 border-slate-100 font-medium h-12 rounded-xl focus:ring-4 focus:ring-indigo-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mentor Explanation</label>
          <TextArea
            placeholder="Provide the official high-quality answer..."
            value={manualData.answer}
            onChange={e => setManualData({ ...manualData, answer: e.target.value })}
            rows={5}
            className="bg-slate-50 border-slate-100 font-medium rounded-xl focus:ring-4 focus:ring-indigo-50"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${manualData.publish ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${manualData.publish ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={manualData.publish}
              onChange={e => setManualData({ ...manualData, publish: e.target.checked })}
            />
            <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Visible to students</span>
          </label>

          <Button
            type="submit"
            disabled={!manualData.question.trim() || !manualData.answer.trim()}
            className="rounded-xl h-12 px-10 bg-indigo-600 hover:bg-indigo-700 font-bold text-sm shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
          >
            {manualData.id ? 'Update FAQ' : 'Save & Publish'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ManualFAQForm;
