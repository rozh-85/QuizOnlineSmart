import { Filter, ToggleLeft, ToggleRight, Search, CheckSquare, Square } from 'lucide-react';
import { Card } from '../ui';
import { TYPE_LABELS, TYPE_ORDER } from '../../constants/examBuilder';
import type { Lecture, QuestionType } from '../../types';
import type { ExamFilterState, ExamFilterActions, ExamBulkActions } from '../../types/examBuilder';

const Toggle = ({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) => (
  <button
    onClick={onToggle}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
      on
        ? 'bg-primary-50 text-primary-700 border-primary-200'
        : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'
    }`}
  >
    {on ? <ToggleRight size={16} className="text-primary-500" /> : <ToggleLeft size={16} />}
    {label}
  </button>
);

interface ExamFiltersProps {
  lectures: Lecture[];
  sections: string[];
  filters: ExamFilterState;
  filterActions: ExamFilterActions;
  bulkActions: ExamBulkActions;
  onToastError: (msg: string) => void;
}

const ExamFilters = ({
  lectures, sections, filters, filterActions, bulkActions, onToastError,
}: ExamFiltersProps) => {
  const {
    lectureFilterOn, sectionFilterOn, typeFilterOn,
    selectedLecture, selectedSection, selectedType, searchQuery,
  } = filters;
  const {
    setLectureFilterOn, setSectionFilterOn, setTypeFilterOn,
    setSelectedLecture, setSelectedSection, setSelectedType, setSearchQuery,
  } = filterActions;
  const { allFilteredSelected, selectedCount, selectAllFiltered, deselectAllFiltered, deselectAll } = bulkActions;
  return (
    <>
      <Card className="!p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-primary-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filters</span>
        </div>

        <div className="space-y-3">
          {/* Lecture Filter */}
          <div className="flex items-start gap-3">
            <Toggle on={lectureFilterOn} onToggle={() => {
              setLectureFilterOn(!lectureFilterOn);
              if (lectureFilterOn) { setSelectedLecture(''); setSectionFilterOn(false); setSelectedSection(''); }
            }} label="Lecture" />
            {lectureFilterOn && (
              <select
                value={selectedLecture}
                onChange={(e) => { setSelectedLecture(e.target.value); setSelectedSection(''); }}
                className="flex-1 h-8 px-2 rounded-lg border-2 border-slate-100 focus:border-primary-400 outline-none transition-all text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="">All Lectures</option>
                {lectures.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Section Filter */}
          <div className="flex items-start gap-3">
            <Toggle on={sectionFilterOn} onToggle={() => {
              if (!lectureFilterOn || !selectedLecture) {
                onToastError('Select a lecture first to filter by section');
                return;
              }
              setSectionFilterOn(!sectionFilterOn);
              if (sectionFilterOn) setSelectedSection('');
            }} label="Section" />
            {sectionFilterOn && (
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="flex-1 h-8 px-2 rounded-lg border-2 border-slate-100 focus:border-primary-400 outline-none transition-all text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="">All Sections</option>
                {sections.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-start gap-3">
            <Toggle on={typeFilterOn} onToggle={() => {
              setTypeFilterOn(!typeFilterOn);
              if (typeFilterOn) setSelectedType('');
            }} label="Type" />
            {typeFilterOn && (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as QuestionType | '')}
                className="flex-1 h-8 px-2 rounded-lg border-2 border-slate-100 focus:border-primary-400 outline-none transition-all text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="">All Types</option>
                {TYPE_ORDER.map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </Card>

      {/* Search + Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border-2 border-slate-100 focus:border-primary-400 outline-none transition-all text-xs font-semibold text-slate-700 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={allFilteredSelected ? deselectAllFiltered : selectAllFiltered}
            className="h-9 px-3 rounded-xl border-2 border-slate-100 hover:border-primary-200 text-xs font-bold text-slate-500 hover:text-primary-600 transition-all bg-white flex items-center gap-1.5"
          >
            {allFilteredSelected ? <Square size={13} /> : <CheckSquare size={13} />}
            {allFilteredSelected ? 'Deselect All' : 'Select All'}
          </button>
          {selectedCount > 0 && (
            <button
              onClick={deselectAll}
              className="h-9 px-3 rounded-xl border-2 border-rose-100 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all bg-white"
            >
              Clear ({selectedCount})
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ExamFilters;
