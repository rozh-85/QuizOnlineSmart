import { Link } from 'react-router-dom';
import { Edit2, Trash2, Eye, EyeOff, CheckCircle, Gauge } from 'lucide-react';
import previewIcon from '../../assets/icons/preview.png';
import { Button, Card } from '../ui';
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
  <Card className="border border-slate-100 hover:border-primary-100 transition-all p-4 group shadow-sm bg-white">
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 pt-0.5">
        <div className="w-7 h-7 rounded-md bg-slate-50 group-hover:bg-primary-50 flex items-center justify-center text-slate-400 group-hover:text-primary-600 font-black text-[11px] transition-colors border border-slate-100 group-hover:border-primary-100">
          {index + 1}
        </div>
      </div>
    
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2">{question.text}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onToggleVisibility}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-all ${
                question.isVisible !== false
                  ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                  : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
              }`}
              title={question.isVisible !== false ? 'Visible to students – click to hide' : 'Hidden from students – click to show'}
            >
              {question.isVisible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            <button
              onClick={onToggleQuickView}
              className={`group h-7 w-7 rounded-md flex items-center justify-center transition-all ${
                quickView 
                  ? 'bg-primary-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-primary-600 hover:bg-primary-50'
              }`}
              title={quickView ? 'Close preview' : 'Open preview'}
            >
              <img
                src={previewIcon}
                alt={quickView ? 'Close preview' : 'Open preview'}
                className={`w-3.5 h-3.5 transition-all ${
                  quickView
                    ? 'opacity-100 brightness-0 invert'
                    : 'opacity-70 grayscale group-hover:opacity-100 group-hover:grayscale-0'
                }`}
              />
            </button>
            <Link to={`/admin/edit/${question.id}`}>
              <Button variant="ghost" size="sm" className="h-7 w-7 !p-0 text-slate-400 hover:text-primary-600">
                <Edit2 size={12} />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              className="h-7 w-7 !p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>

        {/* Quick View Expanded Content */}
        {quickView && (
          <div className="mt-4 mb-4 p-4 rounded-xl bg-slate-50 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
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
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Answer:</span>
            <div className="flex gap-1">
              {question.options.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3.5 h-1.5 rounded-full ${i === question.correctIndex ? 'bg-emerald-500' : 'bg-slate-100'}`}
                />
              ))}
            </div>
          </div>
          {question.explanation && (
            <div className="flex items-center gap-1 text-[9px] text-primary-500 font-black uppercase bg-primary-50/50 px-1.5 py-0.5 rounded border border-primary-50">
              <span>Explanation</span>
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
            question.difficulty === 'easy' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
            question.difficulty === 'hard' ? 'bg-rose-50 border-rose-100 text-rose-600' :
            'bg-amber-50 border-amber-100 text-amber-600'
          }`}>
            <Gauge size={10} />
            {question.difficulty || 'Medium'}
          </div>
          <div className="text-[9px] font-black uppercase text-slate-300 bg-slate-50/50 px-1.5 py-0.5 rounded border border-slate-50">
            {question.type?.replace('-', ' ') || 'multiple choice'}
          </div>
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
            question.isVisible !== false
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            {question.isVisible !== false ? <Eye size={10} /> : <EyeOff size={10} />}
            {question.isVisible !== false ? 'Visible' : 'Hidden'}
          </div>
        </div>
      </div>
    </div>
  </Card>
);

export default QuestionCard;
