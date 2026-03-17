import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Lecture } from '../../types/app';

const ACCENT_PALETTE = [
  { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)'  },  // blue
  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },   // violet
  { color: '#10b981', bg: 'rgba(16,185,129,0.08)' },   // emerald
  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },  // amber
  { color: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },  // rose
  { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)'   },  // cyan
];

interface LectureCardProps {
  lecture: Lecture;
  index: number;
  questionCount: number;
  isHighlighted: boolean;
  cardRef: (el: HTMLDivElement | null) => void;
}

const LectureCard = ({ lecture, index, questionCount, isHighlighted, cardRef }: LectureCardProps) => {
  const { t } = useTranslation();
  const accent = ACCENT_PALETTE[index % ACCENT_PALETTE.length];

  return (
    <Link to={`/quiz?lectureId=${lecture.id}`} className="group block h-full">
      <div
        ref={cardRef}
        className={`h-full bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden flex flex-col
          hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
          ${isHighlighted ? 'animate-pulse-border' : ''}`}
      >
        {/* Colored accent top bar */}
        <div className="h-[3px] w-full flex-shrink-0" style={{ backgroundColor: accent.color }} />

        <div className="p-5 flex flex-col flex-1">
          {/* Header: icon + question badge */}
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
              style={{ backgroundColor: accent.bg, color: accent.color }}
            >
              <BookOpen size={18} />
            </div>

            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: accent.bg, color: accent.color }}
            >
              {t('student.questionsCount', { count: questionCount })}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-slate-900 mb-1.5 group-hover:text-primary-600 transition-colors leading-snug line-clamp-2">
            {lecture.title}
          </h3>

          {/* Description */}
          <p className="text-slate-500 text-xs leading-relaxed flex-1 line-clamp-2 mb-4">
            {lecture.description || t('student.masterModule')}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {/* Sections info */}
            {lecture.sections && lecture.sections.length > 0 ? (
              <div className="flex items-center gap-1 text-slate-400">
                <Layers size={11} />
                <span className="text-[11px] font-medium">
                  {lecture.sections.length} {t('student.sections').toLowerCase()}
                </span>
              </div>
            ) : (
              <div />
            )}

            {/* CTA arrow */}
            <span
              className="text-xs font-bold flex items-center gap-1 transition-all duration-150 group-hover:gap-2"
              style={{ color: accent.color }}
            >
              {t('student.startQuiz')}
              <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default LectureCard;
