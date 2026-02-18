import { HelpCircle, MessageSquare, Send, ImagePlus, X } from 'lucide-react';
import { Button, Card, TextArea } from '../ui';

interface AskQuestionFormProps {
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  newQuestion: string;
  setNewQuestion: (q: string) => void;
  imagePreviews: string[];
  selectedImages: File[];
  isUploading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const AskQuestionForm = ({
  showForm, setShowForm, newQuestion, setNewQuestion,
  imagePreviews, selectedImages, isUploading,
  onSubmit, onImageSelect, onRemoveImage, fileInputRef,
}: AskQuestionFormProps) => {
  if (!showForm) {
    return (
      <div className="flex justify-center py-4">
        <Button
          onClick={() => setShowForm(true)}
          className="rounded-2xl sm:h-14 h-12 sm:px-10 px-8 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-bold text-sm flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
        >
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <MessageSquare size={18} className="text-white" />
          </div>
          <span>Ask Teacher a Question</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <HelpCircle size={18} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">New Inquiry</h2>
            <p className="text-xs font-medium text-slate-500">Your question will be sent privately to the mentor.</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(false)}
          className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
        >
          Cancel
        </button>
      </div>

      <Card className="p-4 sm:p-6 border-slate-200 shadow-lg bg-white rounded-2xl relative overflow-hidden group border-b-4 border-b-indigo-500">
        <form onSubmit={onSubmit} className="relative space-y-4">
          <TextArea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Describe what you're struggling with or need clarification on..."
            rows={4}
            autoFocus
            className="w-full bg-slate-50/50 border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 text-sm font-medium placeholder:text-slate-300 transition-all min-h-[120px]"
          />
          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <img src={preview} alt="Preview" className="h-16 w-16 object-cover rounded-xl border-2 border-indigo-200" />
                  <button
                    type="button"
                    onClick={() => onRemoveImage(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <ImagePlus size={18} />
                <span>Attach Photo</span>
              </button>
            </div>
            <Button
              type="submit"
              disabled={(!newQuestion.trim() && selectedImages.length === 0) || isUploading}
              className="rounded-xl h-11 px-8 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-md shadow-indigo-100"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : (
                <>
                  <span>Send to Teacher</span>
                  <Send size={14} />
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AskQuestionForm;
