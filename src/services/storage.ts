import { Question } from '../types/app';
import { STORAGE_KEYS } from '../constants/storage';
import { generateId } from '../utils/id';

// Sample questions to start with
const sampleQuestions: Question[] = [];

export const getQuestions = (): Question[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.QUIZ_QUESTIONS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : sampleQuestions;
    } catch (e) {
      console.error('Error parsing questions from storage:', e);
      return sampleQuestions;
    }
  }
  // Initialize with sample questions
  localStorage.setItem(STORAGE_KEYS.QUIZ_QUESTIONS, JSON.stringify(sampleQuestions));
  return sampleQuestions;
};

export const saveQuestions = (questions: Question[]): void => {
  localStorage.setItem(STORAGE_KEYS.QUIZ_QUESTIONS, JSON.stringify(questions));
};

// Re-export generateId for backward compatibility
export { generateId };
