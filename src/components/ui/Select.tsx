import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, icon, className = '', containerClassName = '', children, ...props }, ref) => {
    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={`
              w-full bg-white border-2 border-slate-100 rounded-xl outline-none 
              font-black text-[10px] uppercase tracking-widest text-slate-700
              appearance-none cursor-pointer transition-all
              focus:border-primary-500 focus:ring-4 focus:ring-primary-50/50
              hover:border-slate-200
              ${icon ? 'pl-10' : 'px-4'} 
              pr-10 py-2.5
              ${className}
            `}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors">
            <ChevronDown size={14} />
          </div>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
