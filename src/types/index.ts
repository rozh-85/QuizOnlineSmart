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

export interface QuizState {
  currentQuestionIndex: number;
  answers: (number | null)[];
  showResult: boolean;
  score: number;
}

export interface QuizContextType {
  questions: Question[];
  lectures: Lecture[];
  addQuestion: (question: Omit<Question, 'id'>) => Promise<void>;
  updateQuestion: (id: string, question: Omit<Question, 'id'>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  getQuestion: (id: string) => Question | undefined;
  getQuestionsByLecture: (lectureId: string) => Question[];
  toggleQuestionVisibility: (id: string, isVisible: boolean) => Promise<void>;
  addLecture: (lecture: Omit<Lecture, 'id' | 'createdAt'>) => Promise<void>;
  updateLecture: (id: string, lecture: Omit<Lecture, 'id' | 'createdAt'>) => Promise<void>;
  deleteLecture: (id: string) => Promise<void>;
  getLecture: (id: string) => Lecture | undefined;
  
  // Materials
  materials: Material[];
  addMaterial: (material: Omit<Material, 'id' | 'createdAt'>) => Promise<void>;
  updateMaterial: (id: string, material: Partial<Omit<Material, 'id' | 'createdAt'>>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  getMaterialsByLecture: (lectureId: string, sectionId?: string) => Material[];
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

