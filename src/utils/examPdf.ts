import { TYPE_LABELS, TYPE_ORDER } from '../constants/examBuilder';
import type { Question, QuestionType } from '../types';
import type { ExamSettings } from '../types/examBuilder';
import { getFontFamily } from '../constants/typography';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatTimeAllowed(raw: string): string {
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

/**
 * Build the full exam HTML document and open it in a print window.
 * Returns true on success, false if popup was blocked.
 */
export function generateExamPdf(selected: Question[], settings: ExamSettings): boolean {
  // Group by type in defined order
  const grouped: { type: QuestionType; label: string; items: Question[] }[] = [];
  for (const type of TYPE_ORDER) {
    const items = selected.filter(q => q.type === type);
    if (items.length > 0) {
      grouped.push({ type, label: TYPE_LABELS[type], items });
    }
  }

  // ── Header block ──
  let headerHTML = '';
  if (settings.header_enabled) {
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

  // ── Questions grouped by section ──
  let qNum = 0;
  let sectionNum = 0;
  let sectionsHTML = '';

  for (const group of grouped) {
    sectionNum++;

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

  // ── Footer ──
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
    font-family: ${getFontFamily(document.documentElement.lang || 'en')};
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
    return true;
  }
  return false;
}
