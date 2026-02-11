import { Question } from '../types';

const STORAGE_KEY = 'quiz_questions';

// Sample questions to start with
const sampleQuestions: Question[] = [];

export const getQuestions = (): Question[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleQuestions));
  return sampleQuestions;
};

export const saveQuestions = (questions: Question[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
