import type { Locale } from '../../i18n/locale'

export function LocaleFlag({ locale, className = '' }: { locale: Locale; className?: string }) {
  if (locale === 'vi') {
    return (
      <svg viewBox="0 0 60 40" className={className} aria-hidden="true" focusable="false">
        <rect width="60" height="40" rx="3" fill="#DA251D" />
        <path d="m30 8 3.1 9.5h10l-8.1 5.9 3.1 9.6-8.1-5.9-8.1 5.9 3.1-9.6-8.1-5.9h10Z" fill="#FFCD00" />
      </svg>
    )
  }

  if (locale === 'fr') {
    return (
      <svg viewBox="0 0 60 40" className={className} aria-hidden="true" focusable="false">
        <rect width="20" height="40" rx="3" fill="#002395" />
        <rect x="20" width="20" height="40" fill="#FFF" />
        <path d="M40 0h17a3 3 0 0 1 3 3v34a3 3 0 0 1-3 3H40Z" fill="#ED2939" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true" focusable="false">
      <rect width="60" height="40" rx="3" fill="#012169" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#FFF" strokeWidth="9" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0v40M0 20h60" stroke="#FFF" strokeWidth="13" />
      <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="7" />
    </svg>
  )
}
