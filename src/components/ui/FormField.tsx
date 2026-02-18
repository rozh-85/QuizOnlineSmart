import { ReactNode } from 'react';

interface FormFieldProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

const FormField = ({ label, children, className = '' }: FormFieldProps) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-xs font-bold text-slate-500">{label}</label>
    {children}
  </div>
);

export default FormField;
