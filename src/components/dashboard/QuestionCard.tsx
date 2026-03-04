import { Link } from 'react-router-dom';
import { Edit2, Trash2, Eye, EyeOff, CheckCircle, Gauge } from 'lucide-react';
import previewIcon from '../../assets/icons/preview.png';
import { Card } from '../ui';
import { Question } from '../../types';

interface QuestionCardProps {
  question: Question;
  index: number;
  quickView: boolean;
  onToggleQuickView: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}

const QuestionCard = ({
  question,
  index,
  quickView,
  onToggleQuickView,
  onToggleVisibility,
  onDelete,
}: QuestionCardProps) => (
  <Card className="border border-slate-100 hover:border-indigo-200 transition-all p-3 group shadow-sm bg-white hover:shadow-md">
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 pt-0.5">
        <div className="w-6 h-6 rounded-md bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 font-black text-[10px] transition-colors border border-slate-100 group-hover:border-indigo-200">
          {index + 1}
        </div>
      </div>
    
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2 flex-1">{question.text}</h3>
          <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100 md:group-hover:opacity-100">
            <button
              onClick={onToggleVisibility}
              className={`h-6 w-6 rounded-md flex items-center justify-center transition-all ${
                question.isVisible !== false
                  ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                  : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
              }`}
              title={question.isVisible !== false ? 'Visible to students – click to hide' : 'Hidden from students – click to show'}
            >
              {question.isVisible !== false ? <Eye size={11} /> : <EyeOff size={11} />}
            </button>
            <button
              onClick={onToggleQuickView}
              className={`h-6 w-6 rounded-md flex items-center justify-center transition-all ${
                quickView 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
              title={quickView ? 'Close preview' : 'Open preview'}
            >
              <img
                src={previewIcon}
                alt={quickView ? 'Close preview' : 'Open preview'}
                className={`w-3 h-3 transition-all ${
                  quickView
                    ? 'opacity-100 brightness-0 invert'
                    : 'opacity-70 grayscale hover:opacity-100 hover:grayscale-0'
                }`}
              />
            </button>
            <Link to={`/admin/edit/${question.id}`}>
              <button className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                <Edit2 size={11} />
              </button>
            </Link>
            <button
              onClick={onDelete}
              className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* Quick View Expanded Content */}
        {quickView && (
          <div className="mt-3 mb-3 p-3 rounded-xl bg-slate-50 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                <span className="text-[10px] uppercase font-black text-primary-500 block mb-1">Question Body:</span>
                {question.text}
              </p>

              {(question.type === 'multiple-choice' || question.type === 'true-false') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {question.options.map((opt, i) => (
                    <div 
                      key={i} 
                      className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-[11px] font-bold ${
                        i === question.correctIndex 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-white border-slate-100 text-slate-500'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black ${
                        i === question.correctIndex ? 'bg-emerald-500 text-white' : 'bg-slate-100'
                      }`}>
                        {i === question.correctIndex ? <CheckCircle size={10} /> : String.fromCharCode(65 + i)}
                      </div>
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'blank' && (
                <div className="px-3 py-2 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center">
                     <CheckCircle size={10} />
                  </div>
                  <span className="text-[10px] uppercase font-black opacity-60">Correct Answer:</span>
                  {question.correctAnswer}
                </div>
              )}

              {question.explanation && (
                <div className="pt-3 border-t border-slate-200/60">
                   <p className="text-[11px] font-bold text-slate-500 italic">
                     <span className="text-[10px] uppercase font-black text-primary-400 block mb-1 not-italic">Teacher Notes & Explanation:</span>
                     "{question.explanation}"
                   </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
            question.difficulty === 'easy' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
            question.difficulty === 'hard' ? 'bg-rose-50 border-rose-200 text-rose-700' :
            'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <Gauge size={9} />
            {question.difficulty || 'Medium'}
          </div>
          <div className="text-[9px] font-black uppercase text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
            {question.type?.replace('-', ' ') || 'multiple choice'}
          </div>
          {question.explanation && (
            <div className="flex items-center gap-1 text-[9px] text-indigo-600 font-black uppercase bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              <span>Has Explanation</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </Card>
);

export default QuestionCard;
