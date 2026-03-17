import { useState, useMemo } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Lecture } from '../../types/app';
import LectureCard from './LectureCard';

interface LectureGridProps {
  lectures: Lecture[];
  getQuestionsByLecture: (id: string) => { isVisible?: boolean }[];
  highlightId: string | null;
  cardRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

const LectureGrid = ({ lectures, getQuestionsByLecture, highlightId, cardRefs }: LectureGridProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const sorted = useMemo(
    () => [...lectures].sort((a, b) => a.order - b.order),
    [lectures]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      l =>
        l.title.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q))
    );
  }, [sorted, search]);

  return (
    <div
      className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
      id="lectures-section"
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {t('student.availableLectures')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {sorted.length} {t('stats.modules')}
          </p>
        </div>

        {/* Search — only shown when there are enough lectures to warrant it */}
        {sorted.length > 2 && (
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('common.search') + '...'}
              className="w-36 sm:w-48 pl-8 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 transition-all placeholder:text-slate-400"
            />
          </div>
        )}
      </div>

      {/* Lecture cards grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((lecture, index) => {
            const questionCount = getQuestionsByLecture(lecture.id).filter(
              q => q.isVisible !== false
            ).length;
            return (
              <LectureCard
                key={lecture.id}
                lecture={lecture}
                index={index}
                questionCount={questionCount}
                isHighlighted={highlightId === lecture.id}
                cardRef={el => {
                  cardRefs.current[lecture.id] = el;
                }}
              />
            );
          })}
        </div>
      ) : search ? (
        /* No search results */
        <div className="text-center py-14 bg-white rounded-2xl border border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <Search size={22} className="text-slate-300" />
          </div>
          <p className="text-slate-600 font-semibold text-sm">{t('common.noResults')}</p>
          <p className="text-slate-400 text-xs mt-1">
            Try a different keyword
          </p>
        </div>
      ) : (
        /* Truly empty state */
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-600 font-semibold text-sm">{t('student.noLectures')}</p>
          <p className="text-slate-400 text-xs mt-1">{t('student.checkBackSoon')}</p>
        </div>
      )}
    </div>
  );
};

export default LectureGrid;
