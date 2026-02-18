import React from 'react';
import {
  ArrowLeft, Send, ShieldCheck, Trash2, ImagePlus,
  MoreVertical, Pencil, Calendar, X
} from 'lucide-react';
import { Button } from '../ui';
import MessageBubble from './MessageBubble';
import { LectureQuestion, LectureQuestionMessage } from '../../lib/supabase';

/* ─────────── Helpers ─────────── */
const fmtFullDate = (d: string) => {
  return new Date(d).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) + ' at ' + new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface ChatThreadProps {
  selectedQ: LectureQuestion;
  messages: LectureQuestionMessage[];
  isMentor: boolean;
  isAdminView: boolean;
  newMessage: string;
  setNewMessage: (msg: string) => void;
  imagePreviews: string[];
  selectedImages: File[];
  isUploading: boolean;
  editingMessageId: string | null;
  editingText: string;
  menuOpenId: string | null;
  editingQuestionId: string | null;
  editingQuestionText: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onBack: () => void;
  onSendMsg: (e: React.FormEvent) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onMenuToggle: (id: string | null) => void;
  onStartEditMessage: (id: string, text: string) => void;
  onCancelEditMessage: () => void;
  onSaveEditMessage: (id: string) => void;
  onEditTextChange: (text: string) => void;
  onDeleteMessageRequest: (id: string) => void;
  onDeleteThreadRequest: (id: string) => void;
  onViewImage: (url: string) => void;
  onStartEditQuestion: (id: string, text: string) => void;
  onCancelEditQuestion: () => void;
  onSaveEditQuestion: (id: string) => void;
  onEditQuestionTextChange: (text: string) => void;
  parseImageUrls: (url: string | null | undefined) => string[];
}

const ChatThread = ({
  selectedQ, messages, isMentor, isAdminView,
  newMessage, setNewMessage,
  imagePreviews, selectedImages, isUploading,
  editingMessageId, editingText, menuOpenId,
  editingQuestionId, editingQuestionText,
  messagesEndRef, fileInputRef,
  onBack, onSendMsg, onImageSelect, onRemoveImage,
  onMenuToggle, onStartEditMessage, onCancelEditMessage,
  onSaveEditMessage, onEditTextChange, onDeleteMessageRequest,
  onDeleteThreadRequest, onViewImage,
  onStartEditQuestion, onCancelEditQuestion, onSaveEditQuestion,
  onEditQuestionTextChange, parseImageUrls,
}: ChatThreadProps) => {
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
      >
        <ArrowLeft size={14} /> Back to {isMentor ? 'Inbox' : 'My Questions'}
      </button>

      <div className="space-y-5">
        {/* Chat & Controls Container */}
        <div className="flex flex-col h-[500px] sm:h-[650px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-black text-indigo-600">
                {selectedQ.student?.full_name?.charAt(0) || 'S'}
              </div>
              <div>
                <div className="text-base font-black text-slate-900 leading-tight">
                  {selectedQ.student?.full_name || 'Anonymous Student'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck size={10} /> Private Message
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdminView && (
                <Button variant="ghost" size="sm" onClick={() => onDeleteThreadRequest(selectedQ.id)}
                  className="h-9 w-9 p-0 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/20 custom-scrollbar">
            {/* Original question bubble */}
            <div className={`flex ${!isMentor ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-[1.2rem] p-3 px-4 relative ${
                !isMentor
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 rounded-tr-none'
                  : 'bg-white border border-slate-100 text-slate-800 shadow-sm rounded-tl-none'
              }`}>
                {/* Edit question menu */}
                {isMentor && editingQuestionId !== selectedQ.id && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onMenuToggle(menuOpenId === 'q-' + selectedQ.id ? null : 'q-' + selectedQ.id); }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                        !isMentor ? 'hover:bg-white/20 text-white/60 hover:text-white' : 'hover:bg-slate-100 text-slate-300 hover:text-slate-500'
                      }`}
                    >
                      <MoreVertical size={14} />
                    </button>
                    {menuOpenId === 'q-' + selectedQ.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => onMenuToggle(null)} />
                        <div className="absolute z-50 mt-1 right-0 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                          <button
                            onClick={() => { onStartEditQuestion(selectedQ.id, selectedQ.question_text); onMenuToggle(null); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-2 ${!isMentor ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {selectedQ.student?.full_name || 'Student'}
                </div>
                {editingQuestionId === selectedQ.id ? (
                  <div className="space-y-2 min-w-[180px]">
                    <input
                      type="text"
                      value={editingQuestionText}
                      onChange={(e) => onEditQuestionTextChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-800 outline-none"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') onSaveEditQuestion(selectedQ.id); if (e.key === 'Escape') onCancelEditQuestion(); }}
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={onCancelEditQuestion} className="px-3 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                      <button onClick={() => onSaveEditQuestion(selectedQ.id)} className="px-3 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">Save</button>
                    </div>
                  </div>
                ) : (
                  <p className={`text-[13px] font-medium leading-relaxed italic ${!isMentor ? 'text-white' : 'text-slate-800'}`}>"{selectedQ.question_text}"</p>
                )}
                <div className={`text-[10px] font-bold mt-2 flex items-center gap-2 ${!isMentor ? 'opacity-60' : 'text-slate-300'}`}>
                  <Calendar size={10} />
                  {fmtFullDate(selectedQ.created_at)}
                </div>
              </div>
            </div>

            {/* Messages */}
            {messages.map((m: LectureQuestionMessage) => {
              const isTeacherMessage = m.is_from_teacher === true;
              const isStudentMessage = !isTeacherMessage;
              const isMe = isMentor ? isTeacherMessage : isStudentMessage;

              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isMe={isMe}
                  isTeacherMessage={isTeacherMessage}
                  isStudentMessage={isStudentMessage}
                  isMentor={isMentor}
                  studentName={selectedQ.student?.full_name || 'Student'}
                  editingMessageId={editingMessageId}
                  editingText={editingText}
                  menuOpenId={menuOpenId}
                  onMenuToggle={onMenuToggle}
                  onStartEdit={onStartEditMessage}
                  onCancelEdit={onCancelEditMessage}
                  onSaveEdit={onSaveEditMessage}
                  onEditTextChange={onEditTextChange}
                  onDeleteRequest={onDeleteMessageRequest}
                  onViewImage={onViewImage}
                  parseImageUrls={parseImageUrls}
                  fmtFullDate={fmtFullDate}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 sm:p-6 bg-white border-t border-slate-100">
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
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
            <form onSubmit={onSendMsg} className="flex items-center gap-2">
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
                className="rounded-2xl sm:h-[48px] h-[44px] sm:w-[48px] w-[44px] flex-shrink-0 flex items-center justify-center bg-slate-100 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all"
              >
                <ImagePlus size={20} />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 bg-slate-50 border-none rounded-2xl sm:px-6 px-4 sm:py-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-slate-300"
              />
              <Button type="submit" disabled={(!newMessage.trim() && selectedImages.length === 0) || isUploading} className="rounded-2xl sm:h-[48px] h-[44px] sm:w-[48px] w-[44px] !p-0 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-20 flex-shrink-0 transition-all hover:scale-105 active:scale-95">
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatThread;
