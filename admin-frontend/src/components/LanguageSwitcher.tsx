import { ChevronDown, Globe2 } from 'lucide-react'
import { localeLabels, locales, useI18n, type Locale } from '../i18n'
import { LocaleFlag } from './LocaleFlag'

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  return (
    <label className="language-switcher">
      <Globe2 size={16} aria-hidden="true" />
      <LocaleFlag locale={locale} />
      <span className="sr-only">Language</span>
      <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label="Language">
        {locales.map((item) => <option key={item} value={item}>{localeLabels[item]}</option>)}
      </select>
      <ChevronDown size={14} aria-hidden="true" />
    </label>
  )
}
