import { Check, ChevronDown, Languages } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { localeLabels, locales, useI18n, type Locale } from '../i18n'
import { LocaleFlag } from './LocaleFlag'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    const closeOnOutsidePress = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsidePress)
    return () => document.removeEventListener('mousedown', closeOnOutsidePress)
  }, [])

  const focusOption = (index: number) => {
    requestAnimationFrame(() => optionRefs.current[index]?.focus())
  }

  const openMenu = (index = locales.indexOf(locale)) => {
    setOpen(true)
    focusOption(index)
  }

  const chooseLocale = (nextLocale: Locale) => {
    setLocale(nextLocale)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const moveFocus = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const next = event.key === 'ArrowDown' ? (index + 1) % locales.length : event.key === 'ArrowUp' ? (index - 1 + locales.length) % locales.length : event.key === 'Home' ? 0 : locales.length - 1
      optionRefs.current[next]?.focus()
    }
  }

  return (
    <div ref={containerRef} className="admin-locale">
      <button
        ref={triggerRef}
        type="button"
        className="admin-locale-trigger"
        aria-label={t('language')}
        aria-haspopup="listbox"
        aria-controls={`${id}-menu`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
          if (event.key === 'ArrowDown') { event.preventDefault(); openMenu() }
          if (event.key === 'ArrowUp') { event.preventDefault(); openMenu((locales.indexOf(locale) - 1 + locales.length) % locales.length) }
        }}
      >
        <span className="admin-locale-globe"><Languages size={15} aria-hidden="true" /></span>
        <LocaleFlag locale={locale} className="admin-locale-flag" />
        <span className="admin-locale-current"><strong>{locale.toUpperCase()}</strong><small>{localeLabels[locale]}</small></span>
        <ChevronDown className={open ? 'admin-locale-chevron is-open' : 'admin-locale-chevron'} size={15} aria-hidden="true" />
      </button>

      {open && <div id={`${id}-menu`} className="admin-locale-menu" role="listbox" aria-label={t('language')}>
        <p>{t('language')}</p>
        {locales.map((item, index) => <button
          ref={(node) => { optionRefs.current[index] = node }}
          key={item}
          type="button"
          role="option"
          aria-selected={item === locale}
          className={item === locale ? 'admin-locale-option is-selected' : 'admin-locale-option'}
          onClick={() => chooseLocale(item)}
          onKeyDown={(event) => moveFocus(event, index)}
        >
          <LocaleFlag locale={item} className="admin-locale-option-flag" />
          <span><strong>{localeLabels[item]}</strong><small>{item === 'en' ? 'English (UK)' : localeLabels[item]}</small></span>
          {item === locale && <Check size={16} aria-hidden="true" />}
        </button>)}
      </div>}
    </div>
  )
}
