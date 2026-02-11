import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

const Card = ({ children, className = '', hover = false, glow = false }: CardProps) => {
  return (
    <div 
      className={`
        glass rounded-2xl p-5 sm:p-8 
        ${!className.includes('bg-') ? 'bg-white' : ''}
        ${hover ? 'hover:shadow-lg hover:border-primary-100 transition-smooth cursor-pointer' : ''}
        ${glow ? 'glow' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
