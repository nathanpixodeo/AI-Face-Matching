import type { Locale } from '../i18n'

export function LocaleFlag({ locale }: { locale: Locale }) {
  if (locale === 'vi') return <svg className="locale-flag" viewBox="0 0 28 20" role="img" aria-label="Vietnam"><rect width="28" height="20" rx="2" fill="#da251d" /><path d="m14 4 1.47 4.52h4.75l-3.84 2.8 1.47 4.52L14 13.04l-3.85 2.8 1.47-4.52-3.84-2.8h4.75z" fill="#ffde00" /></svg>
  if (locale === 'fr') return <svg className="locale-flag" viewBox="0 0 28 20" role="img" aria-label="France"><rect width="9.34" height="20" rx="2" fill="#002395" /><rect x="9.33" width="9.34" height="20" fill="#fff" /><path d="M18.67 0H26a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-7.33z" fill="#ed2939" /></svg>
  return <svg className="locale-flag" viewBox="0 0 28 20" role="img" aria-label="United Kingdom"><rect width="28" height="20" rx="2" fill="#012169" /><path d="M0 0 28 20M28 0 0 20" stroke="#fff" strokeWidth="4" /><path d="M0 0 28 20M28 0 0 20" stroke="#c8102e" strokeWidth="1.7" /><path d="M14 0v20M0 10h28" stroke="#fff" strokeWidth="6" /><path d="M14 0v20M0 10h28" stroke="#c8102e" strokeWidth="3.2" /></svg>
}
