import { MoreVertical, Pencil, Trash2, Calendar } from 'lucide-react';
import { LectureQuestionMessage } from '../../lib/supabase';

interface MessageBubbleProps {
  message: LectureQuestionMessage;
  isMe: boolean;
  isTeacherMessage: boolean;
  isStudentMessage: boolean;
  isMentor: boolean;
  studentName: string;
  editingMessageId: string | null;
  editingText: string;
  menuOpenId: string | null;
  onMenuToggle: (id: string | null) => void;
  onStartEdit: (id: string, text: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onEditTextChange: (text: string) => void;
  onDeleteRequest: (id: string) => void;
  onViewImage: (url: string) => void;
  parseImageUrls: (url: string | null | undefined) => string[];
  fmtFullDate: (d: string) => string;
}

const MessageBubble = ({
  message: m, isMe, isTeacherMessage, isStudentMessage, isMentor,
  studentName, editingMessageId, editingText, menuOpenId,
  onMenuToggle, onStartEdit, onCancelEdit, onSaveEdit, onEditTextChange,
  onDeleteRequest, onViewImage, parseImageUrls, fmtFullDate,
}: MessageBubbleProps) => {
  const canEdit = isMentor;
  const canDelete = isMentor;
  const hasActions = canEdit || canDelete;

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-[1.2rem] p-3 px-4 relative ${
        isMe
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 rounded-tr-none'
          : 'bg-white border border-slate-100 text-slate-800 shadow-sm rounded-tl-none'
      }`}>
        {/* 3-dot menu */}
        {hasActions && editingMessageId !== m.id && (
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => { e.stopPropagation(); onMenuToggle(menuOpenId === m.id ? null : m.id); }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isMe
                  ? 'hover:bg-white/20 text-white/60 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-300 hover:text-slate-500'
              }`}
            >
              <MoreVertical size={14} />
            </button>
            {menuOpenId === m.id && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => onMenuToggle(null)} />
                <div className={`absolute z-50 mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
                  isMe ? 'right-0' : 'left-0'
                }`}>
                  {canEdit && (
                    <button
                      onClick={() => { onStartEdit(m.id, m.message_text === '📷 Photo' ? '' : m.message_text); onMenuToggle(null); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => { onDeleteRequest(m.id); onMenuToggle(null); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Role labels */}
        {isStudentMessage && (
          <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-2 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
            {m.sender?.full_name || studentName || 'Student'}
          </div>
        )}
        {isTeacherMessage && (
          <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-2 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
            Teacher
          </div>
        )}

        {/* Images */}
        {m.image_url && (() => {
          const urls = parseImageUrls(m.image_url);
          if (urls.length === 1) return (
            <img
              src={urls[0]}
              alt="Attached"
              onClick={() => onViewImage(urls[0])}
              className="rounded-xl max-w-full max-h-[200px] object-cover mb-2 cursor-pointer hover:opacity-90 transition-opacity border border-white/20"
            />
          );
          return (
            <div className={`grid gap-1.5 mb-2 ${urls.length === 2 ? 'grid-cols-2' : urls.length >= 3 ? 'grid-cols-2' : ''}`}>
              {urls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Photo ${idx + 1}`}
                  onClick={() => onViewImage(url)}
                  className="rounded-lg w-full h-[120px] object-cover cursor-pointer hover:opacity-90 transition-opacity border border-white/20"
                />
              ))}
            </div>
          );
        })()}

        {/* Editing mode */}
        {editingMessageId === m.id ? (
          <div className="space-y-2 min-w-[180px]">
            <input
              type="text"
              value={editingText}
              onChange={(e) => onEditTextChange(e.target.value)}
              className={`w-full rounded-lg px-3 py-2 text-[13px] font-medium outline-none ${
                isMe
                  ? 'bg-white/20 border border-white/30 text-white placeholder:text-white/50'
                  : 'bg-slate-50 border border-slate-200 text-slate-800'
              }`}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') onSaveEdit(m.id); if (e.key === 'Escape') onCancelEdit(); }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={onCancelEdit}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  isMe ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => onSaveEdit(m.id)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  isMe ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            {m.message_text && m.message_text !== '📷 Photo' && (
              <p className="text-[13px] font-medium leading-relaxed">{m.message_text}</p>
            )}
            {m.message_text === '📷 Photo' && !m.image_url && (
              <p className="text-[13px] font-medium leading-relaxed">{m.message_text}</p>
            )}
          </>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] mt-2 font-bold flex items-center gap-2 ${isMe ? 'opacity-60' : 'text-slate-300'}`}>
          <Calendar size={10} />
          {fmtFullDate(m.created_at)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
