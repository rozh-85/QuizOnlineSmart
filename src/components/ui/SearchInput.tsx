import { Search } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  containerClassName?: string;
}

const SearchInput = ({
  placeholder = 'Search...',
  value,
  onChange,
  className = '',
  containerClassName = '',
}: SearchInputProps) => (
  <div className={`relative ${containerClassName}`}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all placeholder:text-slate-300 shadow-sm ${className}`}
    />
  </div>
);

export default SearchInput;
