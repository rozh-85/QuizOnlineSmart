import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, FileText, HelpCircle, Clock, ArrowRight, Search, Loader2, Megaphone, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import { authApi } from '../../api/authApi';
import { whatsNewApi } from '../../api/whatsNewApi';
import type { WhatsNewItem } from '../../types/app';
import { adaptWhatsNewItem } from '../../utils/adapters';

const ICON_MAP: Record<string, typeof BookOpen> = {
  lecture: BookOpen,
  material: FileText,
  question: HelpCircle,
  manual: Megaphone,
};

const COLOR_MAP: Record<string, { iconBg: string; iconText: string; badge: string; badgeText: string }> = {
  lecture: { iconBg: 'bg-primary-50', iconText: 'text-primary-600', badge: 'bg-primary-100 text-primary-700', badgeText: 'New Lecture' },
  material: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', badgeText: 'New Materials' },
  question: { iconBg: 'bg-violet-50', iconText: 'text-violet-600', badge: 'bg-violet-100 text-violet-700', badgeText: 'New Questions' },
  manual: { iconBg: 'bg-amber-50', iconText: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', badgeText: 'Announcement' },
};

// Group published items by (itemType, lectureId, same publishedAt batch)
interface NewsGroup {
  key: string;
  itemType: string;
  lectureId: string | null;
  items: WhatsNewItem[];
  publishedAt: string;
}

const StudentNews = () => {
  const [search, setSearch] = useState('');
  const [newsGroups, setNewsGroups] = useState<NewsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { lectures } = useQuiz();

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    const init = async () => {
      try {
        const user = await authApi.getCurrentUser();
        if (!user) { navigate('/login', { replace: true }); return; }

        const raw = await whatsNewApi.getPublished();
        const items = raw.map(adaptWhatsNewItem);

        // Group by itemType + lectureId + publishedAt (same batch)
        const groupMap = new Map<string, NewsGroup>();
        for (const item of items) {
          const batchKey = `${item.itemType}::${item.lectureId || 'null'}::${item.publishedAt || ''}`;
          if (!groupMap.has(batchKey)) {
            groupMap.set(batchKey, {
              key: batchKey,
              itemType: item.itemType,
              lectureId: item.lectureId,
              items: [],
              publishedAt: item.publishedAt || item.createdAt,
            });
          }
          groupMap.get(batchKey)!.items.push(item);
        }

        setNewsGroups(Array.from(groupMap.values()));

        // Mark all news as seen — update localStorage timestamp and reset badge
        try { localStorage.setItem('whats_new_last_seen', new Date().toISOString()); } catch { /* ignore */ }
        window.dispatchEvent(new Event('whats-new-seen'));
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    init();
  }, []);

  const getLectureName = (lectureId: string | null) => {
    if (!lectureId) return 'General';
    return lectures.find(l => l.id === lectureId)?.title || 'Unknown Lecture';
  };

  const fmtRelative = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const fmtDate = (d: string) => {
    return new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredGroups = newsGroups.filter(g => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      getLectureName(g.lectureId).toLowerCase().includes(s) ||
      g.items.some(i => i.title.toLowerCase().includes(s))
    );
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 pt-6 pb-5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">What's New</h1>
              <p className="text-sm text-slate-500">Latest updates from your teacher</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
        {/* Search */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search updates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
          />
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-xl border border-slate-200">
              <Sparkles size={28} className="text-amber-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">No updates yet</p>
              <p className="text-xs text-slate-400 mt-1">Check back soon!</p>
            </div>
          ) : (
            filteredGroups.map((group, idx) => {
              const Icon = ICON_MAP[group.itemType] || BookOpen;
              const colors = COLOR_MAP[group.itemType] || COLOR_MAP.lecture;
              const lectureName = getLectureName(group.lectureId);
              const isExpanded = expandedKeys.has(group.key);
              const lecture = group.lectureId ? lectures.find(l => l.id === group.lectureId) : null;

              // ── Shared header badges ──
              const headerBadges = (
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {idx === 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded">Latest</span>
                  )}
                  <span className={`px-1.5 py-0.5 ${colors.badge} text-[10px] font-semibold rounded`}>
                    {colors.badgeText}
                  </span>
                  {group.items.length > 1 && (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded">
                      ×{group.items.length}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 flex items-center gap-1 ml-1">
                    <Clock size={11} />
                    {fmtRelative(group.publishedAt)}
                  </span>
                </div>
              );

              const footer = (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  Published {fmtDate(group.publishedAt)}
                </div>
              );

              // ── QUESTION card ──
              if (group.itemType === 'question') {
                const previewCount = 2;
                const hasMore = group.items.length > previewCount;
                const visibleItems = isExpanded ? group.items : group.items.slice(0, previewCount);

                return (
                  <div
                    key={group.key}
                    className="bg-white rounded-xl border border-slate-200 hover:border-violet-200 transition-all p-5"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-9 h-9 rounded-lg ${colors.iconBg} ${colors.iconText} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {headerBadges}
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {lectureName}
                        </h3>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {visibleItems.map((item, qi) => (
                        <div key={item.id} className="rounded-lg bg-violet-50 px-3 py-2">
                          <p className="text-xs text-slate-700 leading-relaxed">
                            <span className="text-violet-500 font-semibold mr-1.5">Q{qi + 1}.</span>
                            {item.title}
                          </p>
                        </div>
                      ))}
                    </div>

                    {hasMore && (
                      <button
                        onClick={() => toggleExpand(group.key)}
                        className="flex items-center gap-1 mt-2.5 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
                      >
                        {isExpanded ? (
                          <>Show less <ChevronUp size={14} /></>
                        ) : (
                          <>See all {group.items.length} questions <ChevronDown size={14} /></>
                        )}
                      </button>
                    )}
                    {footer}
                  </div>
                );
              }

              // ── MATERIAL card ──
              if (group.itemType === 'material') {
                const linkTo = group.lectureId ? `/quiz?lectureId=${group.lectureId}&scrollTo=materials` : '/dashboard';
                return (
                  <Link
                    key={group.key}
                    to={linkTo}
                    className="group block bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all p-5"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-9 h-9 rounded-lg ${colors.iconBg} ${colors.iconText} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {headerBadges}
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                          {lectureName}
                        </h3>
                        <div className="space-y-0.5 mt-1">
                          {group.items.slice(0, 3).map(item => (
                            <p key={item.id} className="text-xs text-slate-500 truncate">
                              {item.title}
                            </p>
                          ))}
                          {group.items.length > 3 && (
                            <p className="text-xs text-slate-400">+{group.items.length - 3} more</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2.5 text-xs font-medium text-emerald-600 group-hover:gap-2 transition-all">
                          View Materials <ArrowRight size={13} />
                        </div>
                      </div>
                    </div>
                    {footer}
                  </Link>
                );
              }

              // ── LECTURE card ──
              if (group.itemType === 'lecture') {
                const linkTo = group.lectureId ? `/dashboard?highlight=${group.lectureId}` : '/dashboard';
                return (
                  <Link
                    key={group.key}
                    to={linkTo}
                    className="group block bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-sm transition-all p-5"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-9 h-9 rounded-lg ${colors.iconBg} ${colors.iconText} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {headerBadges}
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                          {lectureName}
                        </h3>
                        {lecture?.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {lecture.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-2.5 text-xs font-medium text-primary-600 group-hover:gap-2 transition-all">
                          View Lecture <ArrowRight size={13} />
                        </div>
                      </div>
                    </div>
                    {footer}
                  </Link>
                );
              }

              // ── MANUAL card: announcement ──
              return (
                <div
                  key={group.key}
                  className="bg-white rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-lg ${colors.iconBg} ${colors.iconText} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {headerBadges}
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">
                        {group.items[0]?.title}
                      </h3>
                      {group.items[0]?.description && (
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {group.items[0].description}
                        </p>
                      )}
                      {lectureName !== 'General' && (
                        <p className="text-xs text-slate-400 mt-2">Related to: {lectureName}</p>
                      )}
                    </div>
                  </div>
                  {footer}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentNews;
