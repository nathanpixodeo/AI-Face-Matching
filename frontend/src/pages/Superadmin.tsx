import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  CirclePause,
  CirclePlay,
  Database,
  Image as ImageIcon,
  RefreshCw,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { api } from '../lib/api'
import type { AccountStatus, PlatformTeam } from '../types'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Skeleton, TableSkeleton } from '../components/ui/Skeleton'
import { useToast } from '../contexts/ToastContext'
import { useI18n, type Locale } from '../i18n/locale'

const planOptions = ['free', 'pro', 'enterprise'] as const

function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : locale === 'fr' ? 'fr-FR' : 'en-US').format(value)
}

function formatDate(value: string, locale: Locale): string {
  return new Date(value).toLocaleDateString(locale === 'vi' ? 'vi-VN' : locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const { t } = useI18n()
  return <Badge variant={status === 'active' ? 'green' : 'red'}>{t(status === 'active' ? 'Active' : 'Suspended')}</Badge>
}

function PageControls({ page, totalPages, onPrevious, onNext }: { page: number; totalPages: number; onPrevious: () => void; onNext: () => void }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-1">
      <span className="mr-2 text-xs text-[#718096]">{t('Page {{page}} of {{total}}', { page, total: totalPages })}</span>
      <button type="button" title={t('Previous page')} aria-label={t('Previous page')} disabled={page === 1} onClick={onPrevious} className="grid h-8 w-8 place-items-center rounded-md border border-[#e2e8f0] text-[#4a5568] transition-colors hover:bg-[#f7fafc] disabled:cursor-not-allowed disabled:opacity-40">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button type="button" title={t('Next page')} aria-label={t('Next page')} disabled={page >= totalPages} onClick={onNext} className="grid h-8 w-8 place-items-center rounded-md border border-[#e2e8f0] text-[#4a5568] transition-colors hover:bg-[#f7fafc] disabled:cursor-not-allowed disabled:opacity-40">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function TeamTable({ teams, isLoading, isError, page, onPrevious, onNext, onRetry, onUpdate }: {
  teams: Awaited<ReturnType<typeof api.platform.teams.list>> | undefined
  isLoading: boolean
  isError: boolean
  page: number
  onPrevious: () => void
  onNext: () => void
  onRetry: () => void
  onUpdate: (id: string, data: { status?: AccountStatus; planName?: PlatformTeam['planName'] }) => void
}) {
  const { locale, t } = useI18n()
  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#718096]">{t('Directory')}</p>
          <h2 className="mt-1 text-lg font-bold text-[#1a202c]">{t('Teams')}</h2>
        </div>
        {teams && <PageControls page={page} totalPages={teams.totalPages} onPrevious={onPrevious} onNext={onNext} />}
      </CardHeader>
      <div className="overflow-x-auto">
        {isError ? (
          <div className="flex min-h-52 flex-col items-center justify-center gap-3 px-5 text-center">
            <p className="text-sm text-[#718096]">{t('Could not load teams.')}</p>
            <Button variant="secondary" size="sm" onClick={onRetry}><RefreshCw className="h-4 w-4" />{t('Retry')}</Button>
          </div>
        ) : isLoading ? <div className="p-5"><TableSkeleton rows={5} /></div> : (
          <table className="min-w-[900px] w-full text-left">
            <thead className="border-b border-[#e2e8f0] bg-[#f7fafc] text-[11px] font-bold uppercase tracking-[0.1em] text-[#718096]">
              <tr>
                <th className="px-5 py-3">{t('Team')}</th>
                <th className="px-5 py-3">{t('Owner')}</th>
                <th className="px-5 py-3">{t('Plan')}</th>
                <th className="px-5 py-3">{t('Usage')}</th>
                <th className="px-5 py-3">{t('Status')}</th>
                <th className="px-5 py-3 text-right">{t('Control')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {teams?.items.map((team) => (
                <tr key={team.id} data-testid={`platform-team-${team.id}`} className="hover:bg-[#fafdfb]">
                  <td className="px-5 py-4">
                    <p className="max-w-52 truncate text-sm font-bold text-[#1a202c]">{team.name}</p>
                    <p className="mt-1 text-xs text-[#718096]">{t('{{count}} members', { count: team.memberCount })} · {formatDate(team.createdAt, locale)}</p>
                  </td>
                  <td className="px-5 py-4">
                    {team.owner ? <><p className="text-sm font-medium text-[#2d3748]">{team.owner.firstName} {team.owner.lastName}</p><p className="max-w-48 truncate text-xs text-[#718096]">{team.owner.email}</p></> : <span className="text-sm text-[#a0aec0]">{t('Unavailable')}</span>}
                  </td>
                  <td className="px-5 py-4">
                    <select aria-label={t('Change {{name}} plan', { name: team.name })} defaultValue={team.planName} onChange={(event) => onUpdate(team.id, { planName: event.target.value as PlatformTeam['planName'] })} className="min-h-8 rounded-md border border-[#e2e8f0] bg-white px-2 text-xs font-semibold capitalize text-[#2d3748] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100">
                      {planOptions.map((plan) => <option key={plan} value={plan}>{t(plan.charAt(0).toUpperCase() + plan.slice(1))}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-xs text-[#4a5568]">
                    <p>{t('{{count}} identities', { count: formatNumber(team.usage.identitiesCount, locale) })} · {t('{{count}} images', { count: formatNumber(team.usage.imagesCount, locale) })}</p>
                    <p className="mt-1 text-[#718096]">{t('{{count}} MB stored', { count: formatNumber(team.usage.storageUsedMB, locale) })}</p>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={team.status} /></td>
                  <td className="px-5 py-4 text-right">
                    <Button size="sm" variant={team.status === 'active' ? 'danger' : 'secondary'} aria-label={t('{{action}} {{name}}', { action: t(team.status === 'active' ? 'Suspend' : 'Activate'), name: team.name })} onClick={() => onUpdate(team.id, { status: team.status === 'active' ? 'suspended' : 'active' })}>
                      {team.status === 'active' ? <CirclePause className="h-4 w-4" /> : <CirclePlay className="h-4 w-4" />}
                      {t(team.status === 'active' ? 'Suspend' : 'Activate')}
                    </Button>
                  </td>
                </tr>
              ))}
              {!teams?.items.length && <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-[#718096]">{t('No teams match this filter.')}</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  )
}

function UserTable({ users, isLoading, isError, page, onPrevious, onNext, onRetry, onUpdate }: {
  users: Awaited<ReturnType<typeof api.platform.users.list>> | undefined
  isLoading: boolean
  isError: boolean
  page: number
  onPrevious: () => void
  onNext: () => void
  onRetry: () => void
  onUpdate: (id: string, status: AccountStatus) => void
}) {
  const { t } = useI18n()
  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#718096]">{t('Access')}</p>
          <h2 className="mt-1 text-lg font-bold text-[#1a202c]">{t('Users')}</h2>
        </div>
        {users && <PageControls page={page} totalPages={users.totalPages} onPrevious={onPrevious} onNext={onNext} />}
      </CardHeader>
      <div className="overflow-x-auto">
        {isError ? (
          <div className="flex min-h-52 flex-col items-center justify-center gap-3 px-5 text-center">
            <p className="text-sm text-[#718096]">{t('Could not load users.')}</p>
            <Button variant="secondary" size="sm" onClick={onRetry}><RefreshCw className="h-4 w-4" />{t('Retry')}</Button>
          </div>
        ) : isLoading ? <div className="p-5"><TableSkeleton rows={5} /></div> : (
          <table className="min-w-[840px] w-full text-left">
            <thead className="border-b border-[#e2e8f0] bg-[#f7fafc] text-[11px] font-bold uppercase tracking-[0.1em] text-[#718096]">
              <tr>
                <th className="px-5 py-3">{t('User')}</th>
                <th className="px-5 py-3">{t('Team')}</th>
                <th className="px-5 py-3">{t('Role')}</th>
                <th className="px-5 py-3">{t('Status')}</th>
                <th className="px-5 py-3 text-right">{t('Control')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {users?.items.map((user) => (
                <tr key={user.id} data-testid={`platform-user-${user.id}`} className="hover:bg-[#fafdfb]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-md bg-[#edf2f7] text-xs font-bold text-[#4a5568]">{user.firstName[0]}{user.lastName[0]}</div>
                      <div className="min-w-0"><p className="text-sm font-bold text-[#1a202c]">{user.firstName} {user.lastName}</p><p className="max-w-56 truncate text-xs text-[#718096]">{user.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#4a5568]">{user.team?.name ?? t('Unavailable')}</td>
                  <td className="px-5 py-4"><div className="flex gap-1.5"><Badge variant="gray">{t(user.role.charAt(0).toUpperCase() + user.role.slice(1))}</Badge>{user.isSuperadmin && <Badge variant="blue">{t('Platform')}</Badge>}</div></td>
                  <td className="px-5 py-4"><StatusBadge status={user.status} /></td>
                  <td className="px-5 py-4 text-right">
                    {user.isSuperadmin ? <span title={t('Superadmin status can only be changed through a controlled operational procedure')} className="text-xs font-medium text-[#a0aec0]">{t('Protected')}</span> : (
                      <Button size="sm" variant={user.status === 'active' ? 'danger' : 'secondary'} aria-label={t('{{action}} {{name}}', { action: t(user.status === 'active' ? 'Suspend' : 'Activate'), name: user.email })} onClick={() => onUpdate(user.id, user.status === 'active' ? 'suspended' : 'active')}>
                        {user.status === 'active' ? <CirclePause className="h-4 w-4" /> : <CirclePlay className="h-4 w-4" />}
                        {t(user.status === 'active' ? 'Suspend' : 'Activate')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!users?.items.length && <tr><td colSpan={5} className="px-5 py-16 text-center text-sm text-[#718096]">{t('No users match this filter.')}</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  )
}

export default function Superadmin() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { locale, t } = useI18n()
  const [teamSearchInput, setTeamSearchInput] = useState('')
  const [userSearchInput, setUserSearchInput] = useState('')
  const [teamSearch, setTeamSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [teamStatus, setTeamStatus] = useState<AccountStatus | ''>('')
  const [userStatus, setUserStatus] = useState<AccountStatus | ''>('')
  const [teamPage, setTeamPage] = useState(1)
  const [userPage, setUserPage] = useState(1)

  const overview = useQuery({ queryKey: ['platform', 'overview'], queryFn: api.platform.overview })
  const teams = useQuery({ queryKey: ['platform', 'teams', teamPage, teamSearch, teamStatus], queryFn: () => api.platform.teams.list({ page: teamPage, search: teamSearch || undefined, status: teamStatus || undefined }) })
  const users = useQuery({ queryKey: ['platform', 'users', userPage, userSearch, userStatus], queryFn: () => api.platform.users.list({ page: userPage, search: userSearch || undefined, status: userStatus || undefined }) })

  const refreshPlatform = () => queryClient.invalidateQueries({ queryKey: ['platform'] })
  const teamUpdate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: AccountStatus; planName?: PlatformTeam['planName'] } }) => api.platform.teams.update(id, data),
    onSuccess: () => { toast('success', t('Team updated')); void refreshPlatform() },
    onError: (error) => toast('error', error instanceof Error ? error.message : t('Could not update team')),
  })
  const userUpdate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AccountStatus }) => api.platform.users.update(id, status),
    onSuccess: () => { toast('success', t('User status updated')); void refreshPlatform() },
    onError: (error) => toast('error', error instanceof Error ? error.message : t('Could not update user')),
  })

  const statCards = [
    { label: t('Teams'), value: overview.data?.teams.total, detail: t('{{count}} active', { count: overview.data?.teams.active ?? 0 }), icon: Building2, color: 'bg-primary-50 text-primary-700' },
    { label: t('Users'), value: overview.data?.users.total, detail: t('{{count}} platform admins', { count: overview.data?.users.superadmins ?? 0 }), icon: UsersRound, color: 'bg-[#eff6ff] text-[#2563eb]' },
    { label: t('Identities'), value: overview.data?.resources.identities, detail: t('Across all teams'), icon: Database, color: 'bg-[#fff7ed] text-[#ea580c]' },
    { label: t('Images'), value: overview.data?.resources.images, detail: t('{{count}} teams suspended', { count: overview.data?.teams.suspended ?? 0 }), icon: ImageIcon, color: 'bg-[#f5f3ff] text-[#7c3aed]' },
  ]

  function applyTeamFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTeamPage(1)
    setTeamSearch(teamSearchInput.trim())
  }

  function applyUserFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUserPage(1)
    setUserSearch(userSearchInput.trim())
  }

  return (
    <div className="space-y-7">
      <section className="border-b border-[#e2e8f0] pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-[#1d1e24] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary-300"><ShieldCheck className="h-4 w-4" />{t('Platform control')}</div>
            <h1 className="text-3xl font-bold text-[#1a202c]">{t('Superadmin')}</h1>
            <p className="mt-1 text-sm text-[#718096]">{t('Monitor tenancy, control access, and manage platform plans.')}</p>
          </div>
          <Button variant="secondary" onClick={() => void refreshPlatform()}><RefreshCw className="h-4 w-4" />{t('Refresh')}</Button>
        </div>
      </section>

      {overview.isError && <div className="border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-600">{t('Could not load platform overview.')}</div>}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {overview.isLoading ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-30 rounded-lg" />) : statCards.map((card) => (
          <Card key={card.label} className="overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#718096]">{card.label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-[#1a202c]">{formatNumber(card.value ?? 0, locale)}</p><p className="mt-1 text-xs text-[#718096]">{card.detail}</p></div><div className={`grid h-10 w-10 place-items-center rounded-md ${card.color}`}><card.icon className="h-5 w-5" /></div></div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 2xl:grid-cols-2">
        <div className="space-y-3">
          <form onSubmit={applyTeamFilters} className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 flex-1"><span className="sr-only">{t('Search teams')}</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a0aec0]" /><input value={teamSearchInput} onChange={(event) => setTeamSearchInput(event.target.value)} placeholder={t('Search teams')} className="min-h-10 w-full rounded-md border border-[#e2e8f0] bg-white py-2 pl-9 pr-3 text-sm text-[#1a202c] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /></label>
            <select aria-label={t('Filter team status')} value={teamStatus} onChange={(event) => { setTeamStatus(event.target.value as AccountStatus | ''); setTeamPage(1) }} className="min-h-10 rounded-md border border-[#e2e8f0] bg-white px-3 text-sm text-[#4a5568] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"><option value="">{t('All statuses')}</option><option value="active">{t('Active')}</option><option value="suspended">{t('Suspended')}</option></select>
            <Button type="submit" variant="secondary"><Search className="h-4 w-4" />{t('Search')}</Button>
          </form>
          <TeamTable teams={teams.data} isLoading={teams.isLoading} isError={teams.isError} page={teamPage} onPrevious={() => setTeamPage((page) => Math.max(1, page - 1))} onNext={() => setTeamPage((page) => page + 1)} onRetry={() => void teams.refetch()} onUpdate={(id, data) => teamUpdate.mutate({ id, data })} />
        </div>
        <div className="space-y-3">
          <form onSubmit={applyUserFilters} className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 flex-1"><span className="sr-only">{t('Search users')}</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a0aec0]" /><input value={userSearchInput} onChange={(event) => setUserSearchInput(event.target.value)} placeholder={t('Search users')} className="min-h-10 w-full rounded-md border border-[#e2e8f0] bg-white py-2 pl-9 pr-3 text-sm text-[#1a202c] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /></label>
            <select aria-label={t('Filter user status')} value={userStatus} onChange={(event) => { setUserStatus(event.target.value as AccountStatus | ''); setUserPage(1) }} className="min-h-10 rounded-md border border-[#e2e8f0] bg-white px-3 text-sm text-[#4a5568] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"><option value="">{t('All statuses')}</option><option value="active">{t('Active')}</option><option value="suspended">{t('Suspended')}</option></select>
            <Button type="submit" variant="secondary"><Search className="h-4 w-4" />{t('Search')}</Button>
          </form>
          <UserTable users={users.data} isLoading={users.isLoading} isError={users.isError} page={userPage} onPrevious={() => setUserPage((page) => Math.max(1, page - 1))} onNext={() => setUserPage((page) => page + 1)} onRetry={() => void users.refetch()} onUpdate={(id, status) => userUpdate.mutate({ id, status })} />
        </div>
      </section>
    </div>
  )
}
