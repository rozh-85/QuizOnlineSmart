import type { QuestionType } from '../types';

export const TYPE_LABELS: Record<QuestionType, string> = {
  'true-false': 'True / False',
  'multiple-choice': 'Multiple Choice',
  'blank': 'Fill in the Blank',
};

export const TYPE_ORDER: QuestionType[] = ['true-false', 'multiple-choice', 'blank'];

export const TYPE_COLORS: Record<QuestionType, string> = {
  'true-false': 'bg-sky-50 text-sky-700 border-sky-200',
  'multiple-choice': 'bg-violet-50 text-violet-700 border-violet-200',
  'blank': 'bg-amber-50 text-amber-700 border-amber-200',
};

export const QUESTIONS_PER_PAGE = 10;
