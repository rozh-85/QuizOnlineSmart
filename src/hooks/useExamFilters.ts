import { useState, useEffect, useMemo } from 'react';
import { QUESTIONS_PER_PAGE } from '../constants/examBuilder';
import type { Question, QuestionType, Lecture } from '../types';
import type { ExamFilterState, ExamFilterActions } from '../types/examBuilder';

interface UseExamFiltersOptions {
  questions: Question[];
  lectures: Lecture[];
}

export function useExamFilters({ questions, lectures }: UseExamFiltersOptions) {
  const [filters, setFilters] = useState<ExamFilterState>({
    lectureFilterOn: false,
    sectionFilterOn: false,
    typeFilterOn: false,
    selectedLecture: '',
    selectedSection: '',
    selectedType: '',
    searchQuery: '',
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Derived: sections for the selected lecture
  const currentLecture = lectures.find(l => l.id === filters.selectedLecture);
  const sections: string[] = currentLecture?.sections || [];

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (filters.lectureFilterOn && filters.selectedLecture && q.lectureId !== filters.selectedLecture) return false;
      if (filters.sectionFilterOn && filters.selectedSection && q.sectionId !== filters.selectedSection) return false;
      if (filters.typeFilterOn && filters.selectedType && q.type !== filters.selectedType) return false;
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        if (!q.text.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [questions, filters]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.lectureFilterOn, filters.selectedLecture,
    filters.sectionFilterOn, filters.selectedSection,
    filters.typeFilterOn, filters.selectedType,
    filters.searchQuery,
  ]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedQuestions = filteredQuestions.slice(
    (safeCurrentPage - 1) * QUESTIONS_PER_PAGE,
    safeCurrentPage * QUESTIONS_PER_PAGE
  );

  // Actions — each setter updates the relevant part of state
  const filterActions: ExamFilterActions = {
    setLectureFilterOn: (v) => setFilters(prev => {
      if (!v) return { ...prev, lectureFilterOn: false, selectedLecture: '', sectionFilterOn: false, selectedSection: '' };
      return { ...prev, lectureFilterOn: true };
    }),
    setSectionFilterOn: (v) => setFilters(prev => ({
      ...prev, sectionFilterOn: v, selectedSection: v ? prev.selectedSection : '',
    })),
    setTypeFilterOn: (v) => setFilters(prev => ({
      ...prev, typeFilterOn: v, selectedType: v ? prev.selectedType : '',
    })),
    setSelectedLecture: (v) => setFilters(prev => ({ ...prev, selectedLecture: v, selectedSection: '' })),
    setSelectedSection: (v) => setFilters(prev => ({ ...prev, selectedSection: v })),
    setSelectedType: (v: QuestionType | '') => setFilters(prev => ({ ...prev, selectedType: v })),
    setSearchQuery: (v) => setFilters(prev => ({ ...prev, searchQuery: v })),
  };

  return {
    filters,
    filterActions,
    sections,
    filteredQuestions,
    paginatedQuestions,
    currentPage: safeCurrentPage,
    totalPages,
    setCurrentPage,
  };
}
