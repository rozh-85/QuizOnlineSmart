import { useState, useMemo } from 'react';
import type { Question } from '../types';
import type { ExamBulkActions } from '../types/examBuilder';

export function useExamSelection(questions: Question[], filteredQuestions: Question[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleQuestion = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const newIds = new Set(selectedIds);
    filteredQuestions.forEach(q => newIds.add(q.id));
    setSelectedIds(newIds);
  };

  const deselectAllFiltered = () => {
    const newIds = new Set(selectedIds);
    filteredQuestions.forEach(q => newIds.delete(q.id));
    setSelectedIds(newIds);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const allFilteredSelected =
    filteredQuestions.length > 0 && filteredQuestions.every(q => selectedIds.has(q.id));

  const selectedQuestions = useMemo(
    () => questions.filter(q => selectedIds.has(q.id)),
    [questions, selectedIds],
  );

  const bulkActions: ExamBulkActions = {
    allFilteredSelected,
    selectedCount: selectedIds.size,
    selectAllFiltered,
    deselectAllFiltered,
    deselectAll,
  };

  return {
    selectedIds,
    selectedQuestions,
    toggleQuestion,
    bulkActions,
  };
}
