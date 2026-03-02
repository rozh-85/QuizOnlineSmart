import type { QuestionType } from './app';

// ── Exam Settings ──

export interface ExamSettings {
  id?: string;
  subject: string;
  department: string;
  college: string;
  date: string;
  time_allowed: string;
  header_enabled: boolean;
  footer_enabled: boolean;
}

// ── Filter state (grouped to avoid flat prop explosion) ──

export interface ExamFilterState {
  selectedLecture: string;
  selectedSection: string;
  selectedType: QuestionType | '';
  searchQuery: string;
}

export interface ExamFilterActions {
  setSelectedLecture: (v: string) => void;
  setSelectedSection: (v: string) => void;
  setSelectedType: (v: QuestionType | '') => void;
  setSearchQuery: (v: string) => void;
}

// ── Selection / bulk actions ──

export interface ExamBulkActions {
  allFilteredSelected: boolean;
  selectedCount: number;
  selectAllFiltered: () => void;
  deselectAllFiltered: () => void;
  deselectAll: () => void;
}
