import {
  Star, HelpCircle, ShieldCheck, CheckCircle2,
  Pencil, EyeOff, Trash2
} from 'lucide-react';
import { Button } from '../ui';
import { LectureQuestion } from '../../lib/supabase';

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
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 px-1">
        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <Star size={18} className="fill-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Public Q&A</h2>
          <p className="text-sm font-medium text-slate-500">Most common inquiries and explanations.</p>
        </div>
      </div>

      <div className="space-y-0 divide-y divide-slate-100">
        {publishedQs.map((q: LectureQuestion) => (
          <div key={q.id} className="py-8 first:pt-2">
            <div className="space-y-4 w-full">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <HelpCircle size={20} />
                </div>
                <div className="pt-1 flex-1">
                  <h4 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">{q.question_text}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                      Anonymous
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      • {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {q.official_answer && (
                <div className="pl-0 sm:pl-14">
                  <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-[1.5rem] sm:rounded-r-[2rem] sm:rounded-bl-[2rem] p-4 sm:p-6 border border-indigo-50/50 relative overflow-hidden group hover:shadow-sm transition-shadow">
                    <div className="absolute top-0 right-0 p-3 opacity-5 text-indigo-600">
                      <ShieldCheck size={64} />
                    </div>
                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <div className="p-1 bg-indigo-100 rounded-full">
                        <CheckCircle2 size={12} />
                      </div>
                      Mentor's Explanation
                    </div>
                    <p className="text-sm sm:text-base font-medium text-slate-700 leading-relaxed whitespace-pre-wrap relative z-10">
                      {q.official_answer}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isAdminView && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pl-0 sm:pl-14 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(q)}
                  className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-slate-100 text-indigo-600 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Pencil size={12} /> Edit explanation
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTogglePublish(q.id, q.is_published)}
                  className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                >
                  <EyeOff size={12} /> Unpublish
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(q.id)}
                  className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <Trash2 size={12} /> Delete
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default PublishedFAQ;
