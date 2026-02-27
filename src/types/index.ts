// Barrel export — all app-level and database-level types

// App types (camelCase, used in components) — exported as-is
export * from './app';

// Exam builder types
export * from './examBuilder';

// Database types (snake_case, matches DB schema) — re-export with Db prefix for clashing names
export type {
  Profile,
  Class,
  ClassStudent,
  QuizSession,
  QuizAnswer,
  LectureMaterial,
  LectureQuestion,
  LectureQuestionMessage,
} from './database';

export type { Lecture as DbLecture } from './database';
export type { Question as DbQuestion } from './database';

