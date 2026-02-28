import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, FileText, HelpCircle, Clock, ArrowRight, Search, Loader2, Megaphone } from 'lucide-react';
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

const COLOR_MAP: Record<string, { gradient: string; badge: string; badgeText: string }> = {
  lecture: { gradient: 'from-primary-500 to-primary-600', badge: 'bg-primary-100 text-primary-700', badgeText: 'New Lecture' },
  material: { gradient: 'from-emerald-500 to-emerald-600', badge: 'bg-emerald-100 text-emerald-700', badgeText: 'New Materials' },
  question: { gradient: 'from-violet-500 to-violet-600', badge: 'bg-violet-100 text-violet-700', badgeText: 'New Questions' },
  manual: { gradient: 'from-amber-500 to-orange-500', badge: 'bg-amber-100 text-amber-700', badgeText: 'Announcement' },
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
  const navigate = useNavigate();
  const { lectures } = useQuiz();

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
      <div className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-white px-4 sm:px-6 pt-8 pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">What's New</h1>
              <p className="text-xs text-slate-400 font-medium">Latest updates from your teacher</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-4">
        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search updates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all shadow-sm"
          />
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-slate-400" size={28} />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={24} className="text-amber-300" />
              </div>
              <p className="text-slate-400 font-bold text-sm">No updates yet</p>
              <p className="text-slate-300 text-xs mt-1">Check back soon!</p>
            </div>
          ) : (
            filteredGroups.map((group, idx) => {
              const Icon = ICON_MAP[group.itemType] || BookOpen;
              const colors = COLOR_MAP[group.itemType] || COLOR_MAP.lecture;
              const lectureName = getLectureName(group.lectureId);
              const isManual = group.itemType === 'manual';
              const linkTo = isManual ? undefined : (group.lectureId ? `/lecture/${group.lectureId}` : '/dashboard');

              const cardContent = (
                <>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {idx === 0 && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-wider rounded-md">Latest</span>
                        )}
                        <span className={`px-2 py-0.5 ${colors.badge} text-[9px] font-black uppercase tracking-wider rounded-md`}>
                          {colors.badgeText}
                        </span>
                        {group.items.length > 1 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded-md">
                            ×{group.items.length}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                          <Clock size={10} />
                          {fmtRelative(group.publishedAt)}
                        </span>
                      </div>

                      {isManual ? (
                        <>
                          <h3 className="text-base font-black text-slate-900 tracking-tight mb-1">
                            {group.items[0]?.title}
                          </h3>
                          {group.items[0]?.description && (
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                              {group.items[0].description}
                            </p>
                          )}
                          {lectureName !== 'General' && (
                            <p className="text-[10px] text-slate-300 font-bold mt-2">Related to: {lectureName}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <h3 className="text-base font-black text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors mb-1 truncate">
                            {lectureName}
                          </h3>
                          <div className="space-y-0.5 mt-1">
                            {group.items.slice(0, 5).map(item => (
                              <p key={item.id} className="text-xs text-slate-400 font-medium truncate">
                                {item.title}
                              </p>
                            ))}
                            {group.items.length > 5 && (
                              <p className="text-xs text-slate-300 font-bold">+{group.items.length - 5} more</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-3 text-[10px] font-black text-primary-600 uppercase tracking-wider group-hover:gap-3 transition-all">
                            View Details <ArrowRight size={12} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-300">
                    Published {fmtDate(group.publishedAt)}
                  </div>
                </>
              );

              return isManual ? (
                <div
                  key={group.key}
                  className="group block bg-white rounded-2xl border border-amber-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-50 transition-all p-5 sm:p-6"
                >
                  {cardContent}
                </div>
              ) : (
                <Link
                  key={group.key}
                  to={linkTo!}
                  className="group block bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50 transition-all p-5 sm:p-6"
                >
                  {cardContent}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentNews;
