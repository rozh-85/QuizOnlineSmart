import { Plus } from 'lucide-react';
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
          className="rounded-lg h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-sm flex items-center gap-2"
        >
          <Plus size={16} />
          <span>{manualData.id ? 'Edit FAQ' : 'Add FAQ'}</span>
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-6 border-slate-200 bg-white rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {manualData.id ? 'Edit FAQ Item' : 'Add FAQ Entry'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {manualData.id ? 'Update the public explanation.' : 'Create a public question and answer for all students.'}
          </p>
        </div>
        <button
          onClick={() => { setShowManualForm(false); setManualData({ id: '', question: '', answer: '', publish: true }); }}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Question</label>
          <Input
            placeholder="e.g. How do I calculate the variance?"
            value={manualData.question}
            onChange={e => setManualData({ ...manualData, question: e.target.value })}
            className="bg-white border-slate-200 h-10 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Answer</label>
          <TextArea
            placeholder="Provide the official answer..."
            value={manualData.answer}
            onChange={e => setManualData({ ...manualData, answer: e.target.value })}
            rows={5}
            className="bg-white border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${manualData.publish ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${manualData.publish ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={manualData.publish}
              onChange={e => setManualData({ ...manualData, publish: e.target.checked })}
            />
            <span className="text-sm text-slate-600">Visible to students</span>
          </label>

          <Button
            type="submit"
            disabled={!manualData.question.trim() || !manualData.answer.trim()}
            className="rounded-lg h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-sm"
          >
            {manualData.id ? 'Update' : 'Save'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ManualFAQForm;
