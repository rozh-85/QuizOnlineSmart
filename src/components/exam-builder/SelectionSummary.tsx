import { Card } from '../ui';
import type { Question, QuestionType } from '../../types';

const TYPE_LABELS: Record<QuestionType, string> = {
  'true-false': 'True / False',
  'multiple-choice': 'Multiple Choice',
  'blank': 'Fill in the Blank',
};

const TYPE_ORDER: QuestionType[] = ['true-false', 'multiple-choice', 'blank'];

const TYPE_COLORS: Record<QuestionType, string> = {
  'true-false': 'bg-sky-50 text-sky-700 border-sky-200',
  'multiple-choice': 'bg-violet-50 text-violet-700 border-violet-200',
  'blank': 'bg-amber-50 text-amber-700 border-amber-200',
};

interface SelectionSummaryProps {
  selectedIds: Set<string>;
  questions: Question[];
}

const SelectionSummary = ({ selectedIds, questions }: SelectionSummaryProps) => {
  if (selectedIds.size === 0) return null;

  const selectedQuestions = questions.filter(q => selectedIds.has(q.id));
  const typeCounts = selectedQuestions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="!p-4 shadow-sm border border-primary-100 bg-primary-50/30 mb-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-primary-600 mb-2">
        Selection ({selectedIds.size})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TYPE_ORDER.map(t => {
          const count = typeCounts[t];
          if (!count) return null;
          return (
            <span
              key={t}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${TYPE_COLORS[t]}`}
            >
              {TYPE_LABELS[t]}: {count}
            </span>
          );
        })}
      </div>
    </Card>
  );
};

export default SelectionSummary;
