import {
  Star, HelpCircle,
  Pencil, EyeOff, Trash2
} from 'lucide-react';
import type { LectureQuestion } from '../../types/database';

interface PublishedFAQProps {
  publishedQs: LectureQuestion[];
  isAdminView: boolean;
  onEdit: (q: LectureQuestion) => void;
  onTogglePublish: (qid: string, published: boolean) => void;
  onDelete: (qid: string) => void;
}

const PublishedFAQ = ({
  publishedQs, isAdminView,
  onEdit, onTogglePublish, onDelete,
}: PublishedFAQProps) => {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Star size={18} className="text-amber-500 fill-amber-500" />
        <h2 className="text-lg font-semibold text-slate-900">Public Q&A</h2>
      </div>

      <div className="space-y-6">
        {publishedQs.map((q: LectureQuestion) => (
          <div key={q.id} className="border border-slate-200 rounded-lg p-4 bg-white">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <HelpCircle size={16} />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-slate-900 leading-snug">{q.question_text}</h4>
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(q.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {q.official_answer && (
                <div className="pl-11">
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                    <div className="text-xs font-semibold text-indigo-600 mb-2">
                      Answer
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {q.official_answer}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isAdminView && (
              <div className="flex items-center gap-4 mt-4 pl-11 text-sm">
                <button
                  onClick={() => onEdit(q)}
                  className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => onTogglePublish(q.id, q.is_published)}
                  className="text-slate-500 hover:text-amber-600 flex items-center gap-1.5"
                >
                  <EyeOff size={14} /> Unpublish
                </button>
                <button
                  onClick={() => onDelete(q.id)}
                  className="text-slate-400 hover:text-rose-600 flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default PublishedFAQ;
