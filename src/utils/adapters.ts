import type { Lecture as DbLecture, Question as DbQuestion, LectureMaterial as DbMaterial, WhatsNewItem as DbWhatsNewItem } from '../types/database';
import type { Lecture, Question, Material, WhatsNewItem } from '../types/app';

// =====================================================
// Type adapters: Supabase (snake_case) <-> App (camelCase)
// =====================================================

export const adaptLecture = (lecture: DbLecture): Lecture => ({
  id: lecture.id,
  title: lecture.title,
  description: lecture.description || '',
  sections: lecture.sections || [],
  order: lecture.order_index,
  createdAt: lecture.created_at,
});

export const adaptQuestion = (question: DbQuestion): Question => ({
  id: question.id,
  text: question.text,
  type: question.type as any,
  difficulty: question.difficulty as any,
  options: question.options || [],
  correctIndex: question.correct_index ?? undefined,
  correctAnswer: question.correct_answer ?? undefined,
  explanation: question.explanation ?? undefined,
  lectureId: question.lecture_id ?? undefined,
  sectionId: question.section_id ?? undefined,
  isVisible: question.is_visible ?? true,
});

export const adaptMaterial = (material: DbMaterial): Material => ({
  id: material.id,
  title: material.title,
  content: material.content || undefined,
  fileUrl: material.file_url || undefined,
  fileName: material.file_name || undefined,
  fileType: material.file_type as any,
  lectureId: material.lecture_id || undefined,
  sectionId: material.section_id || undefined,
  createdAt: material.created_at,
});

export const adaptWhatsNewItem = (item: DbWhatsNewItem): WhatsNewItem => ({
  id: item.id,
  itemType: item.item_type,
  lectureId: item.lecture_id,
  referenceId: item.reference_id,
  title: item.title,
  description: item.description,
  status: item.status,
  teacherId: item.teacher_id,
  createdAt: item.created_at,
  publishedAt: item.published_at,
});
