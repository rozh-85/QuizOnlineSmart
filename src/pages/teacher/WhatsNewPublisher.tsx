import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Check, X, BookOpen, FileText, HelpCircle, Clock, ChevronDown, ChevronUp, History, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { whatsNewApi } from '../../api/whatsNewApi';
import { useQuiz } from '../../context/QuizContext';
import type { WhatsNewItem } from '../../types/app';
import { adaptWhatsNewItem } from '../../utils/adapters';

// Group pending items by (itemType, lectureId)
interface PendingGroup {
  itemType: 'lecture' | 'material' | 'question';
  lectureId: string | null;
  lectureName: string;
  items: WhatsNewItem[];
}

const ITEM_TYPE_META: Record<string, { icon: typeof BookOpen; label: string; color: string; bgColor: string; borderColor: string }> = {
  lecture: { icon: BookOpen, label: 'New Lecture', color: 'text-primary-600', bgColor: 'bg-primary-50', borderColor: 'border-primary-200' },
  material: { icon: FileText, label: 'New Materials', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  question: { icon: HelpCircle, label: 'New Questions', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
};

const WhatsNewPublisher = () => {
  const { lectures } = useQuiz();
  const [pendingGroups, setPendingGroups] = useState<PendingGroup[]>([]);
  const [history, setHistory] = useState<WhatsNewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);

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
      const order = { lecture: 0, material: 1, question: 2 };
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
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
            <Megaphone size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">What's New Publisher</h1>
            <p className="text-sm text-slate-400 font-medium">Review and publish updates for students</p>
          </div>
        </div>
      </div>

      {/* Pending Groups */}
      {pendingGroups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold text-sm">All caught up!</p>
          <p className="text-slate-400 text-xs mt-1">No pending updates to review</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
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
                className={`bg-white rounded-2xl border ${meta.borderColor} shadow-sm overflow-hidden transition-all hover:shadow-md`}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl ${meta.bgColor} ${meta.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={22} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 ${meta.bgColor} ${meta.color} text-[9px] font-black uppercase tracking-wider rounded-md`}>
                          {meta.label}
                        </span>
                        {group.items.length > 1 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded-md">
                            ×{group.items.length} stacked
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-black text-slate-900 tracking-tight mb-1">
                        {group.lectureName}
                      </h3>

                      {/* Item summary + expand toggle */}
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedGroupKey(expandedGroupKey === key ? null : key)}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {expandedGroupKey === key ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span>View {group.items.length} item{group.items.length > 1 ? 's' : ''}</span>
                        </button>

                        {expandedGroupKey !== key && (
                          <div className="space-y-1 mt-2">
                            {group.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex items-center gap-2 text-xs text-slate-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                                <span className="font-semibold truncate">{item.title}</span>
                              </div>
                            ))}
                            {group.items.length > 3 && (
                              <p className="text-[10px] text-slate-300 font-bold pl-3.5">+{group.items.length - 3} more</p>
                            )}
                          </div>
                        )}

                        {expandedGroupKey === key && (
                          <div className="mt-3 space-y-2">
                            {group.items.map((item) => (
                              <div key={item.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-800 break-words">{item.title}</p>
                                    {item.description && (
                                      <p className="text-xs text-slate-500 mt-1 break-words">{item.description}</p>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-300 flex items-center gap-1 flex-shrink-0 pt-0.5">
                                    <Clock size={10} /> {fmtRelative(item.createdAt)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDecline(group)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                        <span className="hidden sm:inline">Decline</span>
                      </button>
                      <button
                        onClick={() => handlePublish(group)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        <span className="hidden sm:inline">Publish</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Toggle */}
      <div className="mt-8">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          <History size={16} />
          <span>Recent History</span>
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showHistory && (
          <div className="mt-4 space-y-2">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No history yet</p>
            ) : (
              history.map((item) => {
                const meta = ITEM_TYPE_META[item.itemType];
                const Icon = meta.icon;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 ${
                      item.status === 'declined' ? 'opacity-50' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${meta.bgColor} ${meta.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400">{getLectureName(item.lectureId)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                      item.status === 'published'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-slate-300 flex-shrink-0">{fmtRelative(item.createdAt)}</span>
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
