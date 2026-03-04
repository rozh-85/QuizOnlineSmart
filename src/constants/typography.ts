/**
 * Typography — Single source of truth for all fonts in the application.
 *
 * Change the font family / weights / Google Fonts URL here and the entire
 * app (CSS, JS, and PDF export) will pick up the new values automatically.
 */

export interface LanguageFont {
  /** CSS font-family value (including fallbacks) */
  fontFamily: string;
  /** Google Fonts family parameter, e.g. "Inter:wght@400;500;600;700" */
  googleFontsFamily: string;
}

/** Per-language font configuration */
export const FONTS: Record<string, LanguageFont> = {
  en: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    googleFontsFamily: 'Inter:wght@400;500;600;700;800;900',
  },
  ku: {
    fontFamily: '"Noto Sans Arabic", "Inter", system-ui, sans-serif',
    googleFontsFamily: 'Noto+Sans+Arabic:wght@400;500;600;700;800;900',
  },
  ar: {
    fontFamily: '"Noto Sans Arabic", "Inter", system-ui, sans-serif',
    googleFontsFamily: 'Noto+Sans+Arabic:wght@400;500;600;700;800;900',
  },
};

/** Default / fallback language key */
export const DEFAULT_FONT_LANG = 'en';

/**
 * Build the full Google Fonts stylesheet URL that loads every configured
 * family in a single request.
 */
export function buildGoogleFontsUrl(): string {
  const seen = new Set<string>();
  const families: string[] = [];

  for (const cfg of Object.values(FONTS)) {
    if (!seen.has(cfg.googleFontsFamily)) {
      seen.add(cfg.googleFontsFamily);
      families.push(`family=${cfg.googleFontsFamily}`);
    }
  }

  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

/**
 * Return the CSS font-family string for a given language code.
 * Falls back to the default language font if the code is unknown.
 */
export function getFontFamily(lang: string): string {
  return (FONTS[lang] ?? FONTS[DEFAULT_FONT_LANG]).fontFamily;
}

/**
 * Apply the correct font-family to the document root for the given language.
 * Called on language change and on initial app mount.
 */
export function applyFontForLanguage(lang: string): void {
  document.documentElement.style.setProperty('--font-family-sans', getFontFamily(lang));
}
