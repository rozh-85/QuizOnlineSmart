import { FileText, Printer, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuiz } from '../../context/QuizContext';
import { useExamFilters } from '../../hooks/useExamFilters';
import { useExamSelection } from '../../hooks/useExamSelection';
import { useExamSettings } from '../../hooks/useExamSettings';
import { generateExamPdf } from '../../utils/examPdf';
import { QUESTIONS_PER_PAGE } from '../../constants/examBuilder';
import { Card, Button } from '../../components/ui';
import {
  ExamFilters,
  QuestionListItem,
  QuestionPagination,
  ExamSettingsPanel,
  SelectionSummary,
} from '../../components/exam-builder';

const ExamBuilder = () => {
  const { questions, lectures } = useQuiz();

  // Composed hooks — all business logic lives here
  const {
    filters, filterActions, sections,
    filteredQuestions, paginatedQuestions,
    currentPage, totalPages, setCurrentPage,
  } = useExamFilters({ questions, lectures });

  const { selectedIds, selectedQuestions, toggleQuestion, bulkActions } = useExamSelection(questions, filteredQuestions);

  const { settings, settingsLoaded, settingsOpen, setSettingsOpen, updateSetting } = useExamSettings();

  // Generate PDF
  const handleGeneratePdf = () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one question to generate the exam');
      return;
    }
    if (!generateExamPdf(selectedQuestions, settings)) {
      toast.error('Please allow popups to generate the exam PDF');
    }
  };

  if (!settingsLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-md">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Exam Builder</h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">
              Select questions &middot; Configure &middot; Generate PDF
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Filters + Question List */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <ExamFilters
            lectures={lectures}
            sections={sections}
            filters={filters}
            filterActions={filterActions}
            bulkActions={bulkActions}
            onToastError={(msg) => toast.error(msg)}
          />

          {/* Question List */}
          <div className="space-y-2">
            {filteredQuestions.length === 0 ? (
              <Card className="!p-8 text-center shadow-sm border border-slate-100">
                <BookOpen size={28} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm font-bold text-slate-400">No questions match the current filters</p>
                <p className="text-xs text-slate-300 mt-1">Try adjusting your filters or search query</p>
              </Card>
            ) : (
              paginatedQuestions.map((q) => (
                <QuestionListItem
                  key={q.id}
                  question={q}
                  isSelected={selectedIds.has(q.id)}
                  lectureName={lectures.find(l => l.id === q.lectureId)?.title}
                  onToggle={() => toggleQuestion(q.id)}
                />
              ))
            )}
          </div>

          {filteredQuestions.length > 0 && (
            <QuestionPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              startIndex={(currentPage - 1) * QUESTIONS_PER_PAGE}
              endIndex={currentPage * QUESTIONS_PER_PAGE}
              totalItems={filteredQuestions.length}
            />
          )}
        </div>

        {/* RIGHT COLUMN: Settings + Generate */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="lg:sticky lg:top-24">
            <SelectionSummary selectedIds={selectedIds} questions={questions} />

            <ExamSettingsPanel
              settings={settings}
              settingsOpen={settingsOpen}
              setSettingsOpen={setSettingsOpen}
              updateSetting={updateSetting}
            />

            <Button
              onClick={handleGeneratePdf}
              variant="primary"
              fullWidth
              className="!py-3.5 shadow-lg shadow-primary-200 !text-sm !font-black !tracking-wide"
              disabled={selectedIds.size === 0}
            >
              <Printer size={18} />
              Generate Exam PDF
              {selectedIds.size > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-lg text-[10px]">
                  {selectedIds.size} Q{selectedIds.size !== 1 ? 's' : ''}
                </span>
              )}
            </Button>

            {selectedIds.size === 0 && (
              <p className="text-center text-[10px] text-slate-300 font-bold mt-2">
                Select questions from the left to enable PDF generation
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamBuilder;
