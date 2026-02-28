import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Check, X, BookOpen, FileText, HelpCircle, Clock, ChevronDown, ChevronUp, History, Loader2, Plus, PenLine, Eye, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { whatsNewApi } from '../../api/whatsNewApi';
import { useQuiz } from '../../context/QuizContext';
import type { WhatsNewItem } from '../../types/app';
import { adaptWhatsNewItem } from '../../utils/adapters';

// Group pending items by (itemType, lectureId)
interface PendingGroup {
  itemType: 'lecture' | 'material' | 'question' | 'manual';
  lectureId: string | null;
  lectureName: string;
  items: WhatsNewItem[];
}

const ITEM_TYPE_META: Record<string, { icon: typeof BookOpen; label: string; color: string; bgColor: string; borderColor: string }> = {
  lecture: { icon: BookOpen, label: 'New Lecture', color: 'text-primary-600', bgColor: 'bg-primary-50', borderColor: 'border-primary-200' },
  material: { icon: FileText, label: 'New Materials', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  question: { icon: HelpCircle, label: 'New Questions', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  manual: { icon: PenLine, label: 'Manual Update', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
};

const WhatsNewPublisher = () => {
  const { lectures, questions, materials } = useQuiz();
  const [pendingGroups, setPendingGroups] = useState<PendingGroup[]>([]);
  const [history, setHistory] = useState<WhatsNewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualLectureId, setManualLectureId] = useState<string>('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);

  const getLectureName = useCallback((lectureId: string | null) => {
    if (!lectureId) return 'General';
    const lecture = lectures.find(l => l.id === lectureId);
    return lecture?.title || 'Unknown Lecture';
  }, [lectures]);

  const loadData = useCallback(async () => {
    try {
      const [pendingRaw, historyRaw] = await Promise.all([
        whatsNewApi.getPending(),
        whatsNewApi.getHistory(),
      ]);

      const pending = pendingRaw.map(adaptWhatsNewItem);
      setHistory(historyRaw.map(adaptWhatsNewItem));

      // Group by (itemType, lectureId)
      const groupMap = new Map<string, PendingGroup>();
      for (const item of pending) {
        const key = `${item.itemType}::${item.lectureId || 'null'}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            itemType: item.itemType,
            lectureId: item.lectureId,
            lectureName: getLectureName(item.lectureId),
            items: [],
          });
        }
        groupMap.get(key)!.items.push(item);
      }

      // Sort: lectures first, then materials, then questions
      const order: Record<string, number> = { lecture: 0, material: 1, question: 2, manual: 3 };
      const groups = Array.from(groupMap.values()).sort((a, b) => {
        const diff = order[a.itemType] - order[b.itemType];
        if (diff !== 0) return diff;
        return a.lectureName.localeCompare(b.lectureName);
      });

      setPendingGroups(groups);
    } catch (err) {
      console.error('Failed to load what\'s new data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [getLectureName]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePublish = async (group: PendingGroup) => {
    const key = `${group.itemType}::${group.lectureId || 'null'}`;
    setProcessingKey(key);
    try {
      await whatsNewApi.publishGroup(group.itemType, group.lectureId);
      toast.success(`Published ${group.items.length} ${group.itemType}(s) to students`);
      await loadData();
    } catch (err) {
      console.error('Publish failed:', err);
      toast.error('Failed to publish');
    } finally {
      setProcessingKey(null);
    }
  };

  const handleDecline = async (group: PendingGroup) => {
    const key = `${group.itemType}::${group.lectureId || 'null'}`;
    setProcessingKey(key);
    try {
      await whatsNewApi.declineGroup(group.itemType, group.lectureId);
      toast.success(`Declined ${group.items.length} item(s)`);
      await loadData();
    } catch (err) {
      console.error('Decline failed:', err);
      toast.error('Failed to decline');
    } finally {
      setProcessingKey(null);
    }
  };

  const handleCreateManual = async () => {
    if (!manualTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    setManualSubmitting(true);
    try {
      await whatsNewApi.createManual({
        title: manualTitle.trim(),
        description: manualDescription.trim() || null,
        lecture_id: manualLectureId || null,
      });
      toast.success('Manual update published!');
      setShowManualModal(false);
      setManualTitle('');
      setManualDescription('');
      setManualLectureId('');
      await loadData();
    } catch (err) {
      console.error('Failed to create manual update:', err);
      toast.error('Failed to create update');
    } finally {
      setManualSubmitting(false);
    }
  };

  const fmtRelative = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">What's New.</h1>
          <p className="text-slate-500 mt-1 font-medium">Review and publish updates for students</p>
        </div>
        <button
          onClick={() => setShowManualModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all"
        >
          <Plus size={18} />
          Add Manual Update
        </button>
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <PenLine size={20} />
                </div>
                <h2 className="text-lg font-black text-slate-900">Add Manual Update</h2>
              </div>
              <button
                onClick={() => { setShowManualModal(false); setManualTitle(''); setManualDescription(''); setManualLectureId(''); }}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Exam schedule updated"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="Optional details about this update..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Related Lecture</label>
                <select
                  value={manualLectureId}
                  onChange={(e) => setManualLectureId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-all bg-white"
                >
                  <option value="">General (no lecture)</option>
                  {lectures.map((lec) => (
                    <option key={lec.id} value={lec.id}>{lec.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => { setShowManualModal(false); setManualTitle(''); setManualDescription(''); setManualLectureId(''); }}
                disabled={manualSubmitting}
                className="px-5 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManual}
                disabled={manualSubmitting || !manualTitle.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
              >
                {manualSubmitting ? <Loader2 size={17} className="animate-spin" /> : <Megaphone size={17} />}
                Publish Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Groups */}
      {pendingGroups.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold text-lg">All caught up!</p>
          <p className="text-slate-400 text-sm mt-1">No pending updates to review</p>
        </div>
      ) : (
        <div className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">
            Pending Review · {pendingGroups.reduce((sum, g) => sum + g.items.length, 0)} items
          </p>
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            {pendingGroups.map((group, idx) => {
              const meta = ITEM_TYPE_META[group.itemType];
              const Icon = meta.icon;
              const key = `${group.itemType}::${group.lectureId || 'null'}`;
              const isProcessing = processingKey === key;
              const isExpanded = expandedGroupKey === key;

              return (
                <div key={key} className={idx > 0 ? 'border-t border-slate-100' : ''}>
                  {/* Main row */}
                  <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-lg ${meta.bgColor} ${meta.color} flex items-center justify-center shrink-0`}>
                      <Icon size={17} />
                    </div>

                    {/* Type badge */}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${meta.bgColor} ${meta.color}`}>
                      {meta.label}
                    </span>

                    {/* Lecture name */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-bold text-slate-800 truncate block">{group.lectureName}</span>
                    </div>

                    {/* Item count */}
                    {group.items.length > 1 && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[9px] font-black text-slate-500 shrink-0">
                        ×{group.items.length}
                      </span>
                    )}

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedGroupKey(isExpanded ? null : key)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shrink-0"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <button
                        onClick={() => handleDecline(group)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                        Decline
                      </button>
                      <button
                        onClick={() => handlePublish(group)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Publish
                      </button>
                    </div>
                  </div>

                  {/* Collapsed preview */}
                  {!isExpanded && group.items.length > 0 && (
                    <div className="px-5 pb-3 -mt-1 pl-[4.25rem]">
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {group.items.slice(0, 3).map((item) => (
                          <span key={item.id} className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                            {item.title}
                          </span>
                        ))}
                        {group.items.length > 3 && (
                          <span className="text-[11px] text-slate-300 font-bold">+{group.items.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pl-[4.25rem]">
                      <div className="rounded-lg border border-slate-100 overflow-hidden">
                        {group.items.map((item, i) => {
                          const isPreviewing = previewItemId === item.id;
                          const question = item.itemType === 'question' ? questions.find(q => q.id === item.referenceId) : null;
                          const material = item.itemType === 'material' ? materials.find(m => m.id === item.referenceId) : null;
                          const lecture = item.itemType === 'lecture' ? lectures.find(l => l.id === item.referenceId) : null;
                          const hasPreview = !!(question || material || lecture);

                          return (
                            <div key={item.id} className={i > 0 ? 'border-t border-slate-100' : ''}>
                              <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-semibold text-slate-700 leading-snug">{item.title}</p>
                                  {item.description && (
                                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 leading-relaxed">{item.description}</p>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-300 font-medium flex items-center gap-1 shrink-0">
                                  <Clock size={10} /> {fmtRelative(item.createdAt)}
                                </span>
                                {hasPreview && (
                                  <button
                                    onClick={() => setPreviewItemId(isPreviewing ? null : item.id)}
                                    className={`p-1 rounded-md transition-all shrink-0 ${isPreviewing ? 'text-primary-600 bg-primary-50' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                                    title="Quick view"
                                  >
                                    <Eye size={13} />
                                  </button>
                                )}
                              </div>

                              {/* Quick view panel */}
                              {isPreviewing && question && (
                                <div className="mx-3 mb-2 p-3 rounded-lg bg-violet-50/50 border border-violet-100 space-y-2">
                                  <p className="text-[12px] font-semibold text-slate-700 leading-snug">{question.text}</p>
                                  {question.type === 'multiple-choice' && question.options.length > 0 && (
                                    <div className="space-y-1">
                                      {question.options.map((opt, oi) => (
                                        <div key={oi} className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] ${
                                          oi === question.correctIndex
                                            ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                                            : 'bg-white text-slate-500 border border-slate-100'
                                        }`}>
                                          {oi === question.correctIndex && <CheckCircle2 size={11} className="shrink-0" />}
                                          <span className="font-semibold shrink-0 text-slate-400 w-4">{String.fromCharCode(65 + oi)}.</span>
                                          <span>{opt}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {question.type === 'true-false' && (
                                    <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
                                      <CheckCircle2 size={11} /> Answer: {question.correctAnswer || (question.correctIndex === 0 ? 'True' : 'False')}
                                    </p>
                                  )}
                                  {question.type === 'blank' && question.correctAnswer && (
                                    <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
                                      <CheckCircle2 size={11} /> Answer: {question.correctAnswer}
                                    </p>
                                  )}
                                  {question.explanation && (
                                    <p className="text-[10px] text-slate-400 italic leading-relaxed border-t border-violet-100 pt-1.5 mt-1.5">{question.explanation}</p>
                                  )}
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                      question.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-600'
                                        : question.difficulty === 'medium' ? 'bg-amber-100 text-amber-600'
                                        : 'bg-rose-100 text-rose-600'
                                    }`}>{question.difficulty}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[8px] font-black uppercase tracking-wider text-slate-500">{question.type}</span>
                                  </div>
                                </div>
                              )}

                              {isPreviewing && material && (
                                <div className="mx-3 mb-2 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 space-y-1.5">
                                  {material.fileType === 'note' && material.content ? (
                                    <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-4">{material.content}</p>
                                  ) : material.fileUrl ? (
                                    <a href={material.fileUrl} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary-600 hover:text-primary-700">
                                      <LinkIcon size={11} />
                                      {material.fileName || 'Open file'}
                                    </a>
                                  ) : (
                                    <p className="text-[11px] text-slate-400">No content preview available</p>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                      material.fileType === 'note' ? 'bg-amber-100 text-amber-600'
                                        : material.fileType === 'pdf' ? 'bg-rose-100 text-rose-600'
                                        : 'bg-blue-100 text-blue-600'
                                    }`}>{material.fileType}</span>
                                    {material.sectionId && (
                                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[8px] font-black uppercase tracking-wider text-slate-500">{material.sectionId}</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {isPreviewing && lecture && (
                                <div className="mx-3 mb-2 p-3 rounded-lg bg-primary-50/50 border border-primary-100 space-y-1.5">
                                  {lecture.description && (
                                    <p className="text-[11px] text-slate-600 leading-relaxed">{lecture.description}</p>
                                  )}
                                  {lecture.sections.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {lecture.sections.map(s => (
                                        <span key={s} className="px-1.5 py-0.5 rounded bg-primary-100 text-[8px] font-black uppercase tracking-wider text-primary-600">{s}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      <div className="mt-8">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors mb-3"
        >
          <History size={15} />
          <span>Recent History</span>
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showHistory && (
          history.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 px-1">No history yet</p>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left pl-5 pr-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Title</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Type</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Lecture</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Status</th>
                    <th className="text-right px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">When</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const meta = ITEM_TYPE_META[item.itemType];
                    const Icon = meta.icon;
                    return (
                      <tr
                        key={item.id}
                        className={`border-t border-slate-100 hover:bg-slate-50/60 transition-colors ${item.status === 'declined' ? 'opacity-50' : ''}`}
                      >
                        <td className="pl-5 pr-3 py-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-md ${meta.bgColor} ${meta.color} flex items-center justify-center shrink-0`}>
                              <Icon size={13} />
                            </div>
                            <span className="text-[12px] font-semibold text-slate-700 truncate max-w-[220px]">{item.title}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${meta.bgColor} ${meta.color}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[11px] text-slate-500 font-medium">{getLectureName(item.lectureId)}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            item.status === 'published'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <span className="text-[10px] text-slate-300 font-medium">{fmtRelative(item.createdAt)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default WhatsNewPublisher;
