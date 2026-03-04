import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { RTL_LANGUAGES } from '../i18n';
import { applyFontForLanguage } from '../constants/typography';

const languages = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'ar', label: 'العربية', flag: 'AR' },
  { code: 'ku', label: 'کوردی', flag: 'KU' },
];

interface LanguageSwitcherProps {
  variant?: 'icon' | 'full';
  className?: string;
}

const LanguageSwitcher = ({ variant = 'icon', className = '' }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    const isRTL = RTL_LANGUAGES.includes(code);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
    applyFontForLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-lg transition-all ${
          variant === 'full'
            ? 'px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            : 'p-2.5 text-slate-500 hover:text-slate-700'
        }`}
        title="Change language"
      >
        <Languages size={variant === 'full' ? 16 : 18} />
        {variant === 'full' && <span>{currentLang.flag}</span>}
      </button>

      {open && (
        <div className="absolute top-full mt-1 end-0 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 min-w-[160px] z-[60] animate-fade-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                i18n.language === lang.code
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                {lang.flag}
              </span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
