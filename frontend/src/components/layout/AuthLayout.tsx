import { Link, Outlet } from 'react-router-dom'
import { CheckCircle2, ScanFace, ShieldCheck } from 'lucide-react'
import { LanguageSwitcher } from '../ui/LanguageSwitcher'
import { useI18n } from '../../i18n/locale'

export function AuthLayout() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <section className="flex w-full flex-col px-5 py-8 sm:px-10 lg:w-1/2 lg:px-12 lg:py-10 xl:pl-20">
        <header className="flex items-center justify-between gap-4">
          <Link to="/login" className="inline-flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1a202c] text-sm font-bold text-white shadow-[0_8px_20px_rgba(26,32,44,.16)]"><span className="relative">FM<span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary-500" /></span></div>
            <div><span className="font-bankco-display text-xl font-semibold tracking-[-.04em] text-[#1a202c]">FaceMatch</span><span className="ml-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#718096]">{t('Operations')}</span></div>
          </Link>
          <LanguageSwitcher compact />
        </header>

        <main className="m-auto w-full max-w-[450px] py-12 lg:py-20"><Outlet /></main>

        <footer className="text-xs font-medium text-[#a0aec0]">© {new Date().getFullYear()} FaceMatch · {t('Secure identity workspace')}</footer>
      </section>

      <aside className="bankco-auth-art hidden w-1/2 items-center justify-center p-12 lg:flex xl:p-20">
        <div className="relative z-10 w-full max-w-[492px] rounded-xl bg-white p-8 shadow-[0_24px_60px_rgba(71,85,105,.10)] xl:p-10">
          <div className="mb-8 flex items-center justify-between"><div className="grid h-12 w-12 place-items-center rounded-xl bg-[#1a202c] text-primary-200"><ScanFace className="h-6 w-6" /></div><div className="inline-flex items-center gap-1.5 rounded-full bg-[#d9fbe6] px-3 py-1.5 text-xs font-bold text-[#15803d]"><ShieldCheck className="h-3.5 w-3.5" />{t('Protected workspace')}</div></div>
          <p className="font-bankco-display text-3xl font-semibold leading-tight tracking-[-.045em] text-[#1a202c]">{t('A calmer way to manage identity data.')}</p>
          <p className="mt-4 max-w-sm text-base leading-7 text-[#718096]">{t('Review image intake, organize people, and find the right face without losing your operational context.')}</p>
          <div className="mt-9 space-y-4 border-t border-[#edf2f7] pt-7">
            {['Organized image intake and review', 'Fast search across known identities', 'Team-level access and capacity controls'].map((item) => <div key={item} className="flex items-center gap-3 text-sm font-semibold text-[#4a5568]"><CheckCircle2 className="h-5 w-5 text-primary-500" />{t(item)}</div>)}
          </div>
          <div className="mt-9 flex items-end justify-between rounded-lg bg-[#f7fafc] p-4"><div><p className="text-xs font-bold uppercase tracking-[.11em] text-[#718096]">{t('Workspace status')}</p><p className="mt-1 font-bankco-display text-lg font-semibold text-[#1a202c]">{t('Ready for review')}</p></div><div className="h-3 w-3 rounded-full bg-primary-500 ring-4 ring-[#d9fbe6]" /></div>
        </div>
      </aside>
    </div>
  )
}
