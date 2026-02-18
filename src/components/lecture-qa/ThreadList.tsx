import { Star, Bell } from 'lucide-react';
import { LectureQuestion } from '../../lib/supabase';

/* ─────────── Helpers ─────────── */
const fmtTime = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getSnippet = (text: string, length = 80) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

interface ThreadListProps {
  list: LectureQuestion[];
  isMentor: boolean;
  compact: boolean;
  selectedQuestionId: string | null;
  onSelectThread: (id: string) => void;
  onMarkAsRead: (q: LectureQuestion) => void;
}

const ThreadList = ({
  list, isMentor, compact, selectedQuestionId,
  onSelectThread, onMarkAsRead,
}: ThreadListProps) => {
  return (
    <section className="space-y-5">
      {!compact && (
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center relative">
            <Bell size={18} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {isMentor ? 'Inquiries' : 'My Questions'}
            </h2>
            <p className="text-xs font-medium text-slate-500">
              {isMentor ? 'Review and respond to private student messages.' : 'Follow up on your private inquiries.'}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {list.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-100 bg-white">
            <p className="text-slate-400 font-bold text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {list.map((q: LectureQuestion) => {
              const lastMsg = q.messages && q.messages.length > 0 ? q.messages[q.messages.length - 1] : null;
              const displayTime = lastMsg ? lastMsg.created_at : q.created_at;
              const snippet = lastMsg ? lastMsg.message_text : q.question_text;
              const isActive = selectedQuestionId === q.id;

              return (
                <div
                  key={q.id}
                  onClick={() => {
                    onMarkAsRead(q);
                    onSelectThread(q.id);
                  }}
                  className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                    }`}>
                      {q.student?.full_name?.charAt(0) || 'S'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-slate-800 truncate">
                              {isMentor ? q.student?.full_name : 'Mentor Response'}
                            </span>
                            {q.is_published && <Star size={10} className="text-amber-500 fill-amber-500" />}
                          </div>
                          <p className="text-xs font-medium text-slate-500 line-clamp-1">
                            {getSnippet(snippet, 80)}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            {fmtTime(displayTime)}
                          </span>
                          {isMentor && !q.is_read && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 text-[9px] text-white font-black uppercase tracking-widest shadow-lg shadow-rose-100 animate-in fade-in zoom-in duration-300">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                              </span>
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ThreadList;
