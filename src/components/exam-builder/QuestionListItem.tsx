import { CheckSquare, BookOpen, Layers } from 'lucide-react';
import type { Question, QuestionType } from '../../types';

const TYPE_LABELS: Record<QuestionType, string> = {
  'true-false': 'True / False',
  'multiple-choice': 'Multiple Choice',
  'blank': 'Fill in the Blank',
};

const TYPE_COLORS: Record<QuestionType, string> = {
  'true-false': 'bg-sky-50 text-sky-700 border-sky-200',
  'multiple-choice': 'bg-violet-50 text-violet-700 border-violet-200',
  'blank': 'bg-amber-50 text-amber-700 border-amber-200',
};

interface QuestionListItemProps {
  question: Question;
  isSelected: boolean;
  lectureName?: string;
  onToggle: () => void;
}

const QuestionListItem = ({ question, isSelected, lectureName, onToggle }: QuestionListItemProps) => {
  return (
    <div
      onClick={onToggle}
      className={`group flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
        isSelected
          ? 'bg-primary-50/50 border-primary-200 shadow-sm'
          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
      }`}
    >
      {/* Checkbox */}
      <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 transition-all border-2 ${
        isSelected
          ? 'bg-primary-600 border-primary-600 text-white'
          : 'border-slate-200 text-transparent group-hover:border-slate-300'
      }`}>
        <CheckSquare size={14} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug mb-1.5 ${
          isSelected ? 'text-slate-900' : 'text-slate-700'
        }`}>
          {question.text.length > 150 ? question.text.slice(0, 150) + '...' : question.text}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${TYPE_COLORS[question.type]}`}>
            {TYPE_LABELS[question.type]}
          </span>
          {lectureName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100">
              <BookOpen size={9} />
              {lectureName}
            </span>
          )}
          {question.sectionId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100">
              <Layers size={9} />
              {question.sectionId}
            </span>
          )}
          {question.type === 'multiple-choice' && question.options && (
            <span className="text-[10px] font-bold text-slate-300">
              {question.options.length} options
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionListItem;
export { TYPE_LABELS, TYPE_COLORS };
