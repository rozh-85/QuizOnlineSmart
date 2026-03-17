import { QrCode, PlayCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeroBannerProps {
  name: string;
  greeting: string;
  lectureCount: number;
}

const HeroBanner = ({ name, greeting, lectureCount }: HeroBannerProps) => {
  const { t } = useTranslation();

  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
    : '?';

  const handleScanClick = () => {
    window.dispatchEvent(new CustomEvent('qr:open'));
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-violet-700 px-4 sm:px-6 pt-8 pb-12 sm:pt-10 sm:pb-14">
      {/* Subtle dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* Decorative blur orbs */}
      <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-violet-400/25 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-blue-300/20 blur-2xl pointer-events-none" />

      <div className="relative max-w-5xl xl:max-w-6xl mx-auto">
        {/* Top row: avatar + greeting / QR button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-lg sm:text-xl font-extrabold text-white tracking-wide">{initials}</span>
            </div>

            {/* Greeting */}
            <div>
              <p className="text-white/65 text-xs sm:text-sm font-medium">{greeting}</p>
              <h1 className="text-white text-xl sm:text-2xl font-extrabold leading-tight mt-0.5">
                {name || t('auth.student')}
              </h1>
              <p className="text-white/60 text-xs mt-1">
                {t('student.pickLecture')}
              </p>
            </div>
          </div>

          {/* QR scan shortcut */}
          <button
            onClick={handleScanClick}
            className="flex-shrink-0 flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 text-white text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition-all"
            aria-label={t('nav.scan')}
          >
            <QrCode size={15} />
            <span className="hidden sm:inline">{t('nav.scan')}</span>
          </button>
        </div>

        {/* Progress hint row */}
        <div className="mt-5 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1.5">
            <PlayCircle size={13} className="text-white/80" />
            <span className="text-white/80 text-xs font-semibold">
              {lectureCount} {t('stats.modules')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
