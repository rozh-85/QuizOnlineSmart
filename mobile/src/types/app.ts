// =====================================================
// Frontend / App types (camelCase, used in components)
// =====================================================

export type QuestionType = 'multiple-choice' | 'true-false' | 'blank';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  options: string[];
  correctIndex?: number;
  correctAnswer?: string;
  explanation?: string;
  lectureId?: string;
  sectionId?: string;
  isVisible?: boolean;
}

export interface Lecture {
  id: string;
  title: string;
  description: string;
  sections: string[];
  order: number;
  createdAt: string;
}

export type MaterialFileType = 'note' | 'pdf' | 'word';

export interface Material {
  id: string;
  title: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileType: MaterialFileType;
  lectureId?: string;
  sectionId?: string;
  createdAt: string;
}

export type WhatsNewItemType = 'lecture' | 'material' | 'question' | 'manual';
export type WhatsNewStatus = 'pending' | 'published' | 'declined';

export interface WhatsNewItem {
  id: string;
  itemType: WhatsNewItemType;
  lectureId: string | null;
  referenceId: string;
  title: string;
  description: string | null;
  status: WhatsNewStatus;
  teacherId: string | null;
  createdAt: string;
  publishedAt: string | null;
}
