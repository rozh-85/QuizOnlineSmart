import { Card } from '../ui';
import { TYPE_LABELS, TYPE_ORDER, TYPE_COLORS } from '../../constants/examBuilder';
import type { Question } from '../../types';

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
