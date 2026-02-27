import { useState, useEffect, useRef } from 'react';
import { FileText, Printer, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuiz } from '../../context/QuizContext';
import { examSettingsApi } from '../../api/examSettingsApi';
import { Card, Button } from '../../components/ui';
import {
  ExamFilters,
  QuestionListItem,
  QuestionPagination,
  ExamSettingsPanel,
  SelectionSummary,
} from '../../components/exam-builder';
import type { Question, QuestionType } from '../../types';

interface ExamSettings {
  id?: string;
  subject: string;
  department: string;
  college: string;
  date: string;
  time_allowed: string;
  header_enabled: boolean;
  footer_enabled: boolean;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  'true-false': 'True / False',
  'multiple-choice': 'Multiple Choice',
  'blank': 'Fill in the Blank',
};

const TYPE_ORDER: QuestionType[] = ['true-false', 'multiple-choice', 'blank'];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTimeAllowed(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    const h = parseInt(colonMatch[1], 10);
    const m = parseInt(colonMatch[2], 10);
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}H`);
    if (m > 0) parts.push(`${m}M`);
    return parts.join(' ') || '0M';
  }
  const num = parseFloat(trimmed);
  if (!isNaN(num) && /^\d+(\.\d+)?$/.test(trimmed)) {
    const h = Math.floor(num);
    const m = Math.round((num - h) * 60);
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}H`);
    if (m > 0) parts.push(`${m}M`);
    return parts.join(' ') || '0M';
  }
  return trimmed;
}

const ExamBuilder = () => {
  const { questions, lectures } = useQuiz();

  // Filters
  const [lectureFilterOn, setLectureFilterOn] = useState(false);
  const [sectionFilterOn, setSectionFilterOn] = useState(false);
  const [typeFilterOn, setTypeFilterOn] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedType, setSelectedType] = useState<QuestionType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const QUESTIONS_PER_PAGE = 10;

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Settings
  const [settings, setSettings] = useState<ExamSettings>({
    subject: '',
    department: '',
    college: '',
    date: '',
    time_allowed: '',
    header_enabled: true,
    footer_enabled: true,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load persisted settings
  useEffect(() => {
    (async () => {
      try {
        const d = await examSettingsApi.getLatest();
        if (d) {
          setSettings({
            id: d.id,
            subject: d.subject || '',
            department: d.department || '',
            college: d.college || '',
            date: d.date || '',
            time_allowed: d.time_allowed || '',
            header_enabled: d.header_enabled ?? true,
            footer_enabled: d.footer_enabled ?? true,
          });
        }
      } catch (e) {
        console.error('Failed to load exam settings:', e);
      } finally {
        setSettingsLoaded(true);
      }
    })();
  }, []);

  // Debounced save settings
  const persistSettings = (newSettings: ExamSettings) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await examSettingsApi.upsert(newSettings);
        if (result && !newSettings.id) {
          setSettings(prev => ({ ...prev, id: result.id }));
        }
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    }, 800);
  };

  const updateSetting = <K extends keyof ExamSettings>(key: K, value: ExamSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      persistSettings(next);
      return next;
    });
  };

  // Filtered questions
  const filteredQuestions = questions.filter(q => {
    if (lectureFilterOn && selectedLecture && q.lectureId !== selectedLecture) return false;
    if (sectionFilterOn && selectedSection && q.sectionId !== selectedSection) return false;
    if (typeFilterOn && selectedType && q.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (!q.text.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [lectureFilterOn, selectedLecture, sectionFilterOn, selectedSection, typeFilterOn, selectedType, searchQuery]);

  // Sections for selected lecture
  const currentLecture = lectures.find(l => l.id === selectedLecture);
  const sections = currentLecture?.sections || [];

  // Selection helpers
  const toggleQuestion = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const newIds = new Set(selectedIds);
    filteredQuestions.forEach(q => newIds.add(q.id));
    setSelectedIds(newIds);
  };

  const deselectAllFiltered = () => {
    const newIds = new Set(selectedIds);
    filteredQuestions.forEach(q => newIds.delete(q.id));
    setSelectedIds(newIds);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Stats
  const selectedQuestions = questions.filter(q => selectedIds.has(q.id));
  const selectedByType: Record<string, number> = {};
  selectedQuestions.forEach(q => {
    selectedByType[q.type] = (selectedByType[q.type] || 0) + 1;
  });

  const allFilteredSelected = filteredQuestions.length > 0 && filteredQuestions.every(q => selectedIds.has(q.id));

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedQuestions = filteredQuestions.slice(
    (safeCurrentPage - 1) * QUESTIONS_PER_PAGE,
    safeCurrentPage * QUESTIONS_PER_PAGE
  );

  // Generate PDF
  const generatePDF = () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one question to generate the exam');
      return;
    }

    const selected = questions.filter(q => selectedIds.has(q.id));

    // Group by type in defined order
    const grouped: { type: QuestionType; label: string; items: Question[] }[] = [];
    for (const type of TYPE_ORDER) {
      const items = selected.filter(q => q.type === type);
      if (items.length > 0) {
        grouped.push({ type, label: TYPE_LABELS[type], items });
      }
    }

    // ── Build professional exam paper HTML ──

    // Header block
    let headerHTML = '';
    if (settings.header_enabled) {
      // Build two-column info rows for the bordered header box
      const leftCol: string[] = [];
      const rightCol: string[] = [];

      if (settings.college) leftCol.push(`<div class="info-row"><span class="info-label">College:</span> ${escapeHtml(settings.college)}</div>`);
      if (settings.department) leftCol.push(`<div class="info-row"><span class="info-label">Department:</span> ${escapeHtml(settings.department)}</div>`);
      if (settings.subject) leftCol.push(`<div class="info-row"><span class="info-label">Subject:</span> ${escapeHtml(settings.subject)}</div>`);

      if (settings.date) rightCol.push(`<div class="info-row"><span class="info-label">Date:</span> ${escapeHtml(settings.date)}</div>`);
      if (settings.time_allowed) rightCol.push(`<div class="info-row"><span class="info-label">Time Allowed:</span> ${escapeHtml(formatTimeAllowed(settings.time_allowed))}</div>`);

      const hasAnyField = leftCol.length > 0 || rightCol.length > 0;

      if (hasAnyField) {
        headerHTML = `
          <div class="exam-header">
            <table class="header-table">
              <tr>
                <td class="header-left">${leftCol.join('')}</td>
                <td class="header-right">${rightCol.join('')}</td>
              </tr>
            </table>
          </div>
          <div class="student-info">
            <span>Student Name: ________________________________________</span>
            <span style="margin-left:40pt;">ID: ____________________</span>
          </div>
        `;
      }
    }

    // Questions grouped by section
    let qNum = 0;
    let sectionNum = 0;
    let sectionsHTML = '';

    for (let gi = 0; gi < grouped.length; gi++) {
      const group = grouped[gi];
      sectionNum++;

      // Section heading – avoid breaking right after heading
      sectionsHTML += `
        <div class="section-heading">
          <div class="section-label">Section ${sectionNum}: ${escapeHtml(group.label)}</div>
          <div class="section-count">${group.items.length} question${group.items.length > 1 ? 's' : ''}</div>
        </div>
      `;

      for (const q of group.items) {
        qNum++;
        let optionsHTML = '';

        if (q.type === 'multiple-choice' && q.options && q.options.length > 0) {
          const optItems = q.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            return `<div class="mc-option"><span class="mc-letter">${letter}.</span> ${escapeHtml(opt)}</div>`;
          }).join('');
          optionsHTML = `<div class="options-grid">${optItems}</div>`;
        } else if (q.type === 'true-false') {
          optionsHTML = `
            <div class="tf-options">
              <label class="tf-choice"><span class="tf-box"></span> True</label>
              <label class="tf-choice"><span class="tf-box"></span> False</label>
            </div>
          `;
        } else if (q.type === 'blank') {
          if (!q.text.includes('_____')) {
            optionsHTML = `<div class="blank-answer">Answer: ____________________________________________________________</div>`;
          }
        }

        sectionsHTML += `
          <div class="question-block">
            <div class="question-text">${qNum}. ${escapeHtml(q.text)}</div>
            ${optionsHTML}
          </div>
        `;
      }
    }

    // Footer
    const footerCSS = settings.footer_enabled
      ? `
        .print-footer {
          position: fixed;
          bottom: 6mm;
          left: 20mm;
          right: 20mm;
          text-align: center;
          font-size: 8.5pt;
          color: #999;
          border-top: 0.5pt solid #ccc;
          padding-top: 4pt;
        }
      `
      : '';

    const footerHTML = settings.footer_enabled
      ? `<div class="print-footer"></div>`
      : '';

    const totalQ = selected.length;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Exam</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11.5pt;
      line-height: 1.55;
      color: #000;
      padding: 18mm 20mm;
      ${settings.footer_enabled ? 'padding-bottom: 24mm;' : ''}
    }

    /* ── Header ── */
    .exam-header {
      border: 2.5pt solid #000;
      padding: 10pt 14pt;
      margin-bottom: 10pt;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
    }
    .header-left, .header-right {
      vertical-align: top;
      width: 50%;
    }
    .header-right {
      text-align: right;
    }
    .info-row {
      font-size: 11pt;
      line-height: 2;
    }
    .info-label {
      font-weight: bold;
    }

    /* ── Student info line ── */
    .student-info {
      font-size: 11pt;
      padding: 8pt 0 6pt;
      border-bottom: 1.5pt solid #000;
      margin-bottom: 14pt;
    }

    /* ── Total questions note ── */
    .exam-note {
      text-align: center;
      font-size: 10pt;
      font-style: italic;
      margin-bottom: 16pt;
      color: #333;
    }

    /* ── Section headings ── */
    .section-heading {
      page-break-inside: avoid;
      page-break-after: avoid;
      margin-top: 18pt;
      margin-bottom: 10pt;
      padding-bottom: 3pt;
      border-bottom: 1pt solid #000;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .section-label {
      font-size: 12.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    .section-count {
      font-size: 9pt;
      color: #555;
      font-style: italic;
    }

    /* ── Question blocks ── */
    .question-block {
      page-break-inside: avoid;
      margin-bottom: 14pt;
      padding-left: 4pt;
    }
    .question-text {
      font-size: 11.5pt;
      line-height: 1.6;
      margin-bottom: 5pt;
    }

    /* ── Multiple choice ── */
    .options-grid {
      padding-left: 18pt;
      margin-top: 3pt;
    }
    .mc-option {
      font-size: 11pt;
      line-height: 1.7;
      padding-left: 2pt;
    }
    .mc-letter {
      font-weight: bold;
      display: inline-block;
      width: 18pt;
    }

    /* ── True / False ── */
    .tf-options {
      padding-left: 18pt;
      margin-top: 4pt;
      display: flex;
      gap: 36pt;
    }
    .tf-choice {
      font-size: 11pt;
      display: inline-flex;
      align-items: center;
      gap: 6pt;
    }
    .tf-box {
      display: inline-block;
      width: 12pt;
      height: 12pt;
      border: 1.2pt solid #000;
      vertical-align: middle;
    }

    /* ── Fill in the blank ── */
    .blank-answer {
      padding-left: 18pt;
      margin-top: 4pt;
      font-size: 11pt;
    }

    /* ── Footer ── */
    ${footerCSS}

    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${headerHTML}
  <div class="exam-note">Total Questions: ${totalQ} &nbsp;&mdash;&nbsp; Answer all questions</div>
  ${sectionsHTML}
  ${footerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
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
            lectureFilterOn={lectureFilterOn}
            setLectureFilterOn={setLectureFilterOn}
            selectedLecture={selectedLecture}
            setSelectedLecture={setSelectedLecture}
            sectionFilterOn={sectionFilterOn}
            setSectionFilterOn={setSectionFilterOn}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            typeFilterOn={typeFilterOn}
            setTypeFilterOn={setTypeFilterOn}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            allFilteredSelected={allFilteredSelected}
            selectAllFiltered={selectAllFiltered}
            deselectAllFiltered={deselectAllFiltered}
            deselectAll={deselectAll}
            selectedCount={selectedIds.size}
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
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              startIndex={(safeCurrentPage - 1) * QUESTIONS_PER_PAGE}
              endIndex={safeCurrentPage * QUESTIONS_PER_PAGE}
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
              onClick={generatePDF}
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
