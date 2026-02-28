import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Check, X, BookOpen, FileText, HelpCircle, Clock, ChevronDown, ChevronUp, History, Loader2, Plus, PenLine } from 'lucide-react';
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
  const { lectures } = useQuiz();
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
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Megaphone size={32} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">What's New Publisher</h1>
            <p className="text-base text-slate-400 font-medium mt-0.5">Review and publish updates for students</p>
          </div>
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-sm hover:shadow-md transition-all"
          >
            <Plus size={18} />
            Add Manual Update
          </button>
        </div>
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
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Check size={36} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold text-lg">All caught up!</p>
          <p className="text-slate-400 text-sm mt-2">No pending updates to review</p>
        </div>
      ) : (
        <div className="space-y-5 mb-10">
          <p className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">
            Pending Review ({pendingGroups.reduce((sum, g) => sum + g.items.length, 0)} items)
          </p>
          {pendingGroups.map((group) => {
            const meta = ITEM_TYPE_META[group.itemType];
            const Icon = meta.icon;
            const key = `${group.itemType}::${group.lectureId || 'null'}`;
            const isProcessing = processingKey === key;

            return (
              <div
                key={key}
                className={`bg-white rounded-2xl border ${meta.borderColor} shadow-sm overflow-hidden transition-all hover:shadow-md relative`}
              >
                <div className="p-6 sm:p-8">
                  {/* Top row: icon + content */}
                  <div className="flex items-start gap-5">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl ${meta.bgColor} ${meta.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon size={26} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-0 sm:pr-56">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-3 py-1 ${meta.bgColor} ${meta.color} text-xs font-black uppercase tracking-wider rounded-lg`}>
                          {meta.label}
                        </span>
                        {group.items.length > 1 && (
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-black rounded-lg">
                            ×{group.items.length} stacked
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {group.lectureName}
                      </h3>

                      {/* Item summary + expand toggle */}
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedGroupKey(expandedGroupKey === key ? null : key)}
                          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {expandedGroupKey === key ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          <span>View {group.items.length} item{group.items.length > 1 ? 's' : ''}</span>
                        </button>

                        {expandedGroupKey !== key && (
                          <div className="space-y-2 mt-3">
                            {group.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex items-start gap-2.5 text-sm text-slate-500">
                                <div className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0 mt-1.5" />
                                <span className="font-semibold leading-relaxed">{item.title}</span>
                              </div>
                            ))}
                            {group.items.length > 3 && (
                              <p className="text-xs text-slate-300 font-bold pl-4">+{group.items.length - 3} more</p>
                            )}
                          </div>
                        )}

                        {expandedGroupKey === key && (
                          <div className="mt-4 space-y-3">
                            {group.items.map((item) => (
                              <div key={item.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-base font-bold text-slate-800 break-words leading-snug">{item.title}</p>
                                    {item.description && (
                                      <p className="text-sm text-slate-500 mt-1.5 break-words leading-relaxed">{item.description}</p>
                                    )}
                                  </div>
                                  <span className="text-xs text-slate-300 flex items-center gap-1.5 flex-shrink-0 pt-1 whitespace-nowrap">
                                    <Clock size={13} /> {fmtRelative(item.createdAt)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons — full-width on mobile, absolute top-right on sm+ */}
                  <div className="flex items-center gap-3 mt-5 sm:mt-0 sm:absolute sm:top-6 sm:right-7">
                    <button
                      onClick={() => handleDecline(group)}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-slate-500 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 size={17} className="animate-spin" /> : <X size={17} />}
                      Decline
                    </button>
                    <button
                      onClick={() => handlePublish(group)}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
                      Publish
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Toggle */}
      <div className="mt-10">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2.5 text-base font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          <History size={18} />
          <span>Recent History</span>
          {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showHistory && (
          <div className="mt-5 space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-slate-400 py-6">No history yet</p>
            ) : (
              history.map((item) => {
                const meta = ITEM_TYPE_META[item.itemType];
                const Icon = meta.icon;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 ${
                      item.status === 'declined' ? 'opacity-50' : ''
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl ${meta.bgColor} ${meta.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{getLectureName(item.lectureId)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${
                      item.status === 'published'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-300 flex-shrink-0">{fmtRelative(item.createdAt)}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsNewPublisher;
