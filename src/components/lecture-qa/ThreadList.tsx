import { Star } from 'lucide-react';
import type { LectureQuestion } from '../../types/database';

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
  selectedQuestionId: string | null;
  onSelectThread: (id: string) => void;
  onMarkAsRead: (q: LectureQuestion) => void;
}

const ThreadList = ({
  list, isMentor, selectedQuestionId,
  onSelectThread, onMarkAsRead,
}: ThreadListProps) => {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        {list.length === 0 ? (
          <div className="py-8 text-center rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-slate-400 text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-1">
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
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {q.student?.full_name?.charAt(0) || 'S'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {isMentor ? q.student?.full_name : 'Mentor Response'}
                            </span>
                            {q.is_published && <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
                            {isMentor && !q.is_read && (
                              <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {getSnippet(snippet, 80)}
                          </p>
                        </div>

                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {fmtTime(displayTime)}
                        </span>
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
