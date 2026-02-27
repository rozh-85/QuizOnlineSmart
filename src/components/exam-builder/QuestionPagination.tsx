import { ChevronLeft, ChevronRight } from 'lucide-react';

interface QuestionPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}

const QuestionPagination = ({
  currentPage, totalPages, onPageChange, startIndex, endIndex, totalItems
}: QuestionPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
      <span className="text-[10px] font-bold text-slate-400">
        {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-all"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
              page === currentPage
                ? 'bg-primary-600 text-white shadow-sm'
                : 'border border-slate-100 text-slate-400 hover:text-slate-700'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default QuestionPagination;
