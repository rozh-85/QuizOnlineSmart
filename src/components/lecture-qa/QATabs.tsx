import { MessageSquare, Star } from 'lucide-react';

interface QATabsProps {
  activeTab: 'inbox' | 'public';
  onTabChange: (tab: 'inbox' | 'public') => void;
}

const QATabs = ({ activeTab, onTabChange }: QATabsProps) => (
  <div className="flex p-1 bg-slate-100 rounded-xl sm:mb-6 mb-4">
    <button
      onClick={() => onTabChange('inbox')}
      className={`flex-1 flex items-center justify-center gap-2 sm:py-2.5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
        activeTab === 'inbox'
          ? 'bg-white text-indigo-600 shadow-sm'
          : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <MessageSquare size={14} />
      <span>Private Inbox</span>
    </button>
    <button
      onClick={() => onTabChange('public')}
      className={`flex-1 flex items-center justify-center gap-2 sm:py-2.5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
        activeTab === 'public'
          ? 'bg-white text-amber-600 shadow-sm'
          : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Star size={14} />
      <span>Public Q&A</span>
    </button>
  </div>
);

export default QATabs;
