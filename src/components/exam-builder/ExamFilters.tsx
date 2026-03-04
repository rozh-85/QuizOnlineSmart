import { Search, CheckSquare, Square, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TYPE_LABELS, TYPE_ORDER } from '../../constants/examBuilder';
import type { Lecture, QuestionType } from '../../types';
import type { ExamFilterState, ExamFilterActions, ExamBulkActions } from '../../types/examBuilder';

interface ExamFiltersProps {
  lectures: Lecture[];
  sections: string[];
  filters: ExamFilterState;
  filterActions: ExamFilterActions;
  bulkActions: ExamBulkActions;
  onToastError: (msg: string) => void;
}

const selectCls = (active: boolean) =>
  `h-9 pl-3 pr-7 rounded-lg border-2 text-xs font-semibold outline-none transition-all bg-white appearance-none cursor-pointer ${
    active
      ? 'border-primary-400 text-primary-700 bg-primary-50'
      : 'border-slate-100 text-slate-500 hover:border-slate-200'
  }`;

const ExamFilters = ({
  lectures, sections, filters, filterActions, bulkActions,
}: ExamFiltersProps) => {
  const { t } = useTranslation();
  const { selectedLecture, selectedSection, selectedType, searchQuery } = filters;
  const { setSelectedLecture, setSelectedSection, setSelectedType, setSearchQuery } = filterActions;
  const { allFilteredSelected, selectedCount, selectAllFiltered, deselectAllFiltered, deselectAll } = bulkActions;

  const hasAnyFilter = selectedLecture || selectedSection || selectedType || searchQuery.trim();

  const clearAll = () => {
    setSelectedLecture('');
    setSelectedSection('');
    setSelectedType('');
    setSearchQuery('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white rounded-xl border-2 border-slate-100 shadow-sm">
      {/* Search */}
      <div className="relative min-w-[140px] flex-1">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('examBuilder.searchQuestions')}
          className="w-full h-9 pl-8 pr-3 rounded-lg border-2 border-slate-100 focus:border-primary-400 outline-none transition-all text-xs font-semibold text-slate-700 bg-white"
        />
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-100 hidden sm:block shrink-0" />

      {/* Lecture */}
      <div className="relative shrink-0">
        <select
          value={selectedLecture}
          onChange={(e) => { setSelectedLecture(e.target.value); setSelectedSection(''); }}
          className={selectCls(!!selectedLecture)}
        >
          <option value="">{t('examBuilder.allLectures')}</option>
          {lectures.map(l => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>

      {/* Section */}
      <div className="relative shrink-0">
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          disabled={!selectedLecture}
          className={`${selectCls(!!selectedSection)} disabled:opacity-40 disabled:cursor-not-allowed`}
          title={!selectedLecture ? t('examBuilder.selectLectureFirst') : undefined}
        >
          <option value="">{t('examBuilder.allSections')}</option>
          {sections.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>

      {/* Type */}
      <div className="relative shrink-0">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as QuestionType | '')}
          className={selectCls(!!selectedType)}
        >
          <option value="">{t('examBuilder.allTypes')}</option>
          {TYPE_ORDER.map(t => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>

      {/* Clear filters */}
      {hasAnyFilter && (
        <button
          onClick={clearAll}
          className="h-9 px-2.5 rounded-lg border-2 border-slate-100 hover:border-rose-200 text-slate-400 hover:text-rose-500 transition-all bg-white shrink-0"
          title="Clear all filters"
        >
          <X size={13} />
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-6 bg-slate-100 hidden sm:block shrink-0" />

      {/* Bulk actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={allFilteredSelected ? deselectAllFiltered : selectAllFiltered}
          className="h-9 px-3 rounded-lg border-2 border-slate-100 hover:border-primary-200 text-xs font-bold text-slate-500 hover:text-primary-600 transition-all bg-white flex items-center gap-1.5 whitespace-nowrap"
        >
          {allFilteredSelected ? <Square size={13} /> : <CheckSquare size={13} />}
          {allFilteredSelected ? t('examBuilder.deselectAll') : t('examBuilder.selectAll')}
        </button>
        {selectedCount > 0 && (
          <button
            onClick={deselectAll}
            className="h-9 px-3 rounded-lg border-2 border-rose-100 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all bg-white whitespace-nowrap"
          >
            {t('common.clear')} ({selectedCount})
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamFilters;
