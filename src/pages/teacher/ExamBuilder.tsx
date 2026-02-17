import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Filter,
  Settings2,
  Printer,
  CheckSquare,
  Square,
  ToggleLeft,
  ToggleRight,
  Search,
  BookOpen,
  Layers,
  Type,
  Calendar,
  Clock,
  Building2,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Hash,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuiz } from '../../context/QuizContext';
import { supabase } from '../../lib/supabase';
import { Card, Button } from '../../components/ui';
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

const TYPE_COLORS: Record<QuestionType, string> = {
  'true-false': 'bg-sky-50 text-sky-700 border-sky-200',
  'multiple-choice': 'bg-violet-50 text-violet-700 border-violet-200',
  'blank': 'bg-amber-50 text-amber-700 border-amber-200',
};

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

// --- Extracted sub-components (must live OUTSIDE ExamBuilder to avoid remount on every render) ---

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

const HeaderField = ({ icon: Icon, label, value, onChange, placeholder, type = 'text' }: {
  icon: any;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) => {
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  if (type === 'date') {
    return (
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
          <Icon size={11} />
          {label}
        </label>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-9 px-3 pr-9 rounded-lg border-2 border-slate-100 focus:border-primary-400 outline-none transition-all text-xs font-semibold text-slate-700 bg-white"
          />
          <input
            ref={hiddenDateRef}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
            tabIndex={-1}
          />
          <button
            type="button"
            onClick={() => hiddenDateRef.current?.showPicker?.()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary-500 transition-colors"
          >
            <Calendar size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
        <Icon size={11} />
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 rounded-lg border-2 border-slate-100 focus:border-primary-400 outline-none transition-all text-xs font-semibold text-slate-700 bg-white"
      />
    </div>
  );
};

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
        const { data, error } = await supabase
          .from('exam_settings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const d = data[0];
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
        const payload = {
          subject: newSettings.subject,
          department: newSettings.department,
          college: newSettings.college,
          date: newSettings.date,
          time_allowed: newSettings.time_allowed,
          header_enabled: newSettings.header_enabled,
          footer_enabled: newSettings.footer_enabled,
        };

        if (newSettings.id) {
          await supabase.from('exam_settings').update(payload).eq('id', newSettings.id);
        } else {
          const { data } = await supabase
            .from('exam_settings')
            .insert([payload])
            .select()
            .single();
          if (data) {
            setSettings(prev => ({ ...prev, id: data.id }));
          }
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

          {/* Filters */}
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
                    toast.error('Select a lecture first to filter by section');
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
              {selectedIds.size > 0 && (
                <button
                  onClick={deselectAll}
                  className="h-9 px-3 rounded-xl border-2 border-rose-100 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all bg-white"
                >
                  Clear ({selectedIds.size})
                </button>
              )}
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-2">
            {filteredQuestions.length === 0 ? (
              <Card className="!p-8 text-center shadow-sm border border-slate-100">
                <BookOpen size={28} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm font-bold text-slate-400">No questions match the current filters</p>
                <p className="text-xs text-slate-300 mt-1">Try adjusting your filters or search query</p>
              </Card>
            ) : (
              filteredQuestions.map((q) => {
                const isSelected = selectedIds.has(q.id);
                const lectureName = lectures.find(l => l.id === q.lectureId)?.title;
                return (
                  <div
                    key={q.id}
                    onClick={() => toggleQuestion(q.id)}
                    className={`group flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary-50/50 border-primary-200 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 transition-all border-2 ${
                      isSelected
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-slate-200 text-transparent group-hover:border-slate-300'
                    }`}>
                      <CheckSquare size={14} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-snug mb-1.5 ${
                        isSelected ? 'text-slate-900' : 'text-slate-700'
                      }`}>
                        {q.text.length > 150 ? q.text.slice(0, 150) + '...' : q.text}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${TYPE_COLORS[q.type]}`}>
                          {TYPE_LABELS[q.type]}
                        </span>
                        {lectureName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100">
                            <BookOpen size={9} />
                            {lectureName}
                          </span>
                        )}
                        {q.sectionId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100">
                            <Layers size={9} />
                            {q.sectionId}
                          </span>
                        )}
                        {q.type === 'multiple-choice' && q.options && (
                          <span className="text-[10px] font-bold text-slate-300">
                            {q.options.length} options
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {filteredQuestions.length > 0 && (
            <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest py-2">
              {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} shown
            </p>
          )}
        </div>

        {/* RIGHT COLUMN: Settings + Generate */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="lg:sticky lg:top-24">

            {/* Selection Summary */}
            {selectedIds.size > 0 && (
              <Card className="!p-4 shadow-sm border border-primary-100 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash size={14} className="text-primary-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">
                    Selected: {selectedIds.size} question{selectedIds.size !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TYPE_ORDER.map(t => {
                    const count = selectedByType[t] || 0;
                    if (count === 0) return null;
                    return (
                      <span key={t} className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${TYPE_COLORS[t]}`}>
                        {TYPE_LABELS[t]}: {count}
                      </span>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Header Settings */}
            <Card className="!p-4 shadow-sm border border-slate-100 mb-4">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-full flex items-center justify-between mb-0"
              >
                <div className="flex items-center gap-2">
                  <Settings2 size={15} className="text-primary-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Exam Settings
                  </span>
                </div>
                {settingsOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {settingsOpen && (
                <div className="mt-4 space-y-4">
                  {/* Header Toggle */}
                  <div>
                    <button
                      onClick={() => updateSetting('header_enabled', !settings.header_enabled)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${
                        settings.header_enabled
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      <span className={`text-xs font-black ${settings.header_enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                        Exam Header
                      </span>
                      <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                        settings.header_enabled ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          settings.header_enabled ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </div>
                    </button>
                  </div>

                  {settings.header_enabled && (
                    <div className="space-y-3 pl-1">
                      <HeaderField
                        icon={Building2}
                        label="College"
                        value={settings.college}
                        onChange={(v) => updateSetting('college', v)}
                        placeholder="e.g. College of Science"
                      />
                      <HeaderField
                        icon={GraduationCap}
                        label="Department"
                        value={settings.department}
                        onChange={(v) => updateSetting('department', v)}
                        placeholder="e.g. Chemistry Dept."
                      />
                      <HeaderField
                        icon={Type}
                        label="Subject"
                        value={settings.subject}
                        onChange={(v) => updateSetting('subject', v)}
                        placeholder="e.g. Organic Chemistry"
                      />
                      <HeaderField
                        icon={Calendar}
                        label="Date"
                        value={settings.date}
                        onChange={(v) => updateSetting('date', v)}
                        placeholder="e.g. 2025-02-17"
                        type="date"
                      />
                      <HeaderField
                        icon={Clock}
                        label="Time Allowed"
                        value={settings.time_allowed}
                        onChange={(v) => updateSetting('time_allowed', v)}
                        placeholder="e.g. 2 Hours"
                      />
                      <p className="text-[10px] text-slate-400 font-medium italic">
                        Only filled fields will appear in the PDF header. Settings auto-save.
                      </p>
                    </div>
                  )}

                  {/* Footer Toggle */}
                  <div>
                    <button
                      onClick={() => updateSetting('footer_enabled', !settings.footer_enabled)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${
                        settings.footer_enabled
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      <span className={`text-xs font-black ${settings.footer_enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                        Page Footer
                      </span>
                      <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                        settings.footer_enabled ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          settings.footer_enabled ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </div>
                    </button>
                    {settings.footer_enabled && (
                      <p className="text-[10px] text-slate-400 font-medium italic mt-2 pl-1">
                        Enable "Headers and footers" in the print dialog to include page numbers.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Generate Button */}
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
