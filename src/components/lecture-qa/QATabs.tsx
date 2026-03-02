import { MessageSquare, Star } from 'lucide-react';

interface QATabsProps {
  activeTab: 'inbox' | 'public';
  onTabChange: (tab: 'inbox' | 'public') => void;
}

const QATabs = ({ activeTab, onTabChange }: QATabsProps) => (
  <div className="flex border-b border-slate-200 sm:mb-6 mb-4">
    <button
      onClick={() => onTabChange('inbox')}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
        activeTab === 'inbox'
          ? 'text-indigo-600 border-b-2 border-indigo-600'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <MessageSquare size={16} />
      <span>Private Inbox</span>
    </button>
    <button
      onClick={() => onTabChange('public')}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
        activeTab === 'public'
          ? 'text-amber-600 border-b-2 border-amber-600'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <Star size={16} />
      <span>Public Q&A</span>
    </button>
  </div>
);

export default QATabs;
