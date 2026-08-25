import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { localeLabels, supportedLocales, useI18n } from '../../i18n/locale'
import { LocaleFlag } from './LocaleFlag'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeOnOutsidePress = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsidePress)
    return () => document.removeEventListener('mousedown', closeOnOutsidePress)
  }, [])

  const chooseLocale = (next: typeof locale) => {
    setLocale(next)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label={t('Language')}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') setOpen(true)
        }}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#edf2f7] bg-white px-2.5 py-2 text-[#4a5568] shadow-[0_2px_5px_rgba(42,49,60,.025)] transition-colors hover:border-primary-200 hover:bg-[#fafffb] focus:outline-none focus:ring-4 focus:ring-primary-100"
      >
        <LocaleFlag locale={locale} className="h-4 w-6 rounded-[3px] shadow-[0_1px_2px_rgba(26,32,44,.18)]" />
        <span className="text-xs font-bold">{compact ? locale.toUpperCase() : localeLabels[locale]}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#a0aec0] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div role="listbox" aria-label={t('Language')} className="absolute right-0 top-[calc(100%+8px)] z-50 w-44 overflow-hidden rounded-xl border border-[#edf2f7] bg-white p-1.5 shadow-[0_18px_40px_rgba(42,49,60,.14)]">
          {supportedLocales.map((item) => (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={item === locale}
              onClick={() => chooseLocale(item)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${item === locale ? 'bg-[#effcf3] text-[#15803d]' : 'text-[#4a5568] hover:bg-[#f7fafc]'}`}
            >
              <LocaleFlag locale={item} className="h-4 w-6 rounded-[3px] shadow-[0_1px_2px_rgba(26,32,44,.18)]" />
              <span>{localeLabels[item]}</span>
              {item === locale && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
