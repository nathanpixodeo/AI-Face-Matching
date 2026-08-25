import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Building2, ChevronLeft, ChevronRight, LogOut, Search, ShieldCheck, Users } from 'lucide-react'
import { useAdminAuth } from '../auth/AuthContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useI18n } from '../i18n'
import { adminApi } from '../lib/api'
import type { AccountStatus, PlanName } from '../types'

type Section = 'overview' | 'teams' | 'users'
const pageSize = 10

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value))
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  const { t } = useI18n()
  if (totalPages <= 1) return null
  return <div className="pagination"><button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} />{t('previous')}</button><span>{t('page')} {page} / {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>{t('next')}<ChevronRight size={16} /></button></div>
}

export function PlatformConsole() {
  const { user, logout } = useAdminAuth()
  const { locale, t } = useI18n()
  const client = useQueryClient()
  const [section, setSection] = useState<Section>('overview')
  const [teamSearch, setTeamSearch] = useState('')
  const [teamStatus, setTeamStatus] = useState('')
  const [teamPage, setTeamPage] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  const [userStatus, setUserStatus] = useState('')
  const [userPage, setUserPage] = useState(1)

  const overview = useQuery({ queryKey: ['platform', 'overview'], queryFn: adminApi.overview })
  const teamParams = useMemo(() => new URLSearchParams({ page: String(teamPage), limit: String(pageSize), ...(teamSearch ? { search: teamSearch } : {}), ...(teamStatus ? { status: teamStatus } : {}) }), [teamPage, teamSearch, teamStatus])
  const userParams = useMemo(() => new URLSearchParams({ page: String(userPage), limit: String(pageSize), ...(userSearch ? { search: userSearch } : {}), ...(userStatus ? { status: userStatus } : {}) }), [userPage, userSearch, userStatus])
  const teams = useQuery({ queryKey: ['platform', 'teams', teamParams.toString()], queryFn: () => adminApi.teams(teamParams), enabled: section === 'teams' })
  const users = useQuery({ queryKey: ['platform', 'users', userParams.toString()], queryFn: () => adminApi.users(userParams), enabled: section === 'users' })
  const updateTeam = useMutation({ mutationFn: ({ id, data }: { id: string; data: { status?: AccountStatus; planName?: PlanName } }) => adminApi.updateTeam(id, data), onSuccess: () => client.invalidateQueries({ queryKey: ['platform'] }) })
  const updateUser = useMutation({ mutationFn: ({ id, status }: { id: string; status: AccountStatus }) => adminApi.updateUserStatus(id, status), onSuccess: () => client.invalidateQueries({ queryKey: ['platform'] }) })
  const nav = [
    { id: 'overview' as const, label: t('overview'), icon: BarChart3 },
    { id: 'teams' as const, label: t('teams'), icon: Building2 },
    { id: 'users' as const, label: t('users'), icon: Users },
  ]

  const overviewError = overview.error ? <p className="query-error">{t('error')}</p> : null
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-logo"><span><ShieldCheck size={21} /></span><div><strong>FaceMatch</strong><small>{t('platform')}</small></div></div>
      <nav>{nav.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={section === id ? 'nav-active' : ''} onClick={() => setSection(id)}><Icon size={18} />{label}</button>)}</nav>
      <div className="admin-sidebar-footer"><div className="admin-user"><span>{user?.firstName?.[0] ?? 'A'}{user?.lastName?.[0] ?? ''}</span><div><strong>{user?.firstName} {user?.lastName}</strong><small>{user?.email}</small></div></div><button type="button" className="signout" onClick={logout}><LogOut size={16} />{t('signOut')}</button></div>
    </aside>
    <main className="admin-main">
      <header className="admin-header"><div><span className="eyebrow">PLATFORM / {section.toUpperCase()}</span><h1>{nav.find((item) => item.id === section)?.label}</h1></div><LanguageSwitcher /></header>
      {section === 'overview' && <section className="admin-content">
        {overviewError}
        <div className="metric-grid">
          <Metric title={t('totalTeams')} value={overview.data?.teams.total} icon={<Building2 />} />
          <Metric title={t('totalUsers')} value={overview.data?.users.total} icon={<Users />} />
          <Metric title={t('identities')} value={overview.data?.resources.identities} icon={<ShieldCheck />} />
          <Metric title={t('images')} value={overview.data?.resources.images} icon={<Users />} />
        </div>
        <div className="content-grid"><section className="panel"><div className="panel-heading"><h2>{t('platformHealth')}</h2></div><div className="plan-stack">{[{ key: 'teamActive', label: t('active'), count: overview.data?.teams.active ?? 0, total: overview.data?.teams.total ?? 0 }, { key: 'teamSuspended', label: t('suspended'), count: overview.data?.teams.suspended ?? 0, total: overview.data?.teams.total ?? 0 }, { key: 'userActive', label: t('activeUsers'), count: overview.data?.users.active ?? 0, total: overview.data?.users.total ?? 0 }, { key: 'userSuspended', label: t('suspendedUsers'), count: overview.data?.users.suspended ?? 0, total: overview.data?.users.total ?? 0 }].map((item) => <div key={item.key}><div><span className="plan-badge free">{item.label}</span><strong>{item.count}</strong></div><i><b style={{ width: item.total ? `${(item.count / item.total) * 100}%` : '0%' }} /></i></div>)}</div></section>
          <section className="panel"><div className="panel-heading"><h2>{t('accessGuard')}</h2></div><div className="compact-list"><div><span className="team-avatar"><ShieldCheck size={15} /></span><div><strong>{overview.data?.users.superadmins ?? 0} {t('superadmins')}</strong><small>{t('secureAccess')}</small></div><span className="plan-badge pro">JWT</span></div><div><span className="team-avatar"><Building2 size={15} /></span><div><strong>{overview.data?.teams.active ?? 0} {t('active')}</strong><small>{t('totalTeams')}: {overview.data?.teams.total ?? 0}</small></div></div><div><span className="team-avatar"><Users size={15} /></span><div><strong>{overview.data?.users.active ?? 0} {t('activeUsers')}</strong><small>{t('totalUsers')}: {overview.data?.users.total ?? 0}</small></div></div></div></section></div>
      </section>}
      {section === 'teams' && <section className="admin-content"><div className="toolbar"><label className="search-box"><Search size={17} /><input value={teamSearch} onChange={(event) => { setTeamSearch(event.target.value); setTeamPage(1) }} placeholder={t('searchTeams')} /></label><select value={teamStatus} onChange={(event) => { setTeamStatus(event.target.value); setTeamPage(1) }}><option value="">{t('allStatuses')}</option><option value="active">{t('active')}</option><option value="suspended">{t('suspended')}</option></select></div>{teams.error && <p className="query-error">{t('error')}</p>}<div className="panel table-panel"><table><thead><tr><th>{t('team')}</th><th>{t('owner')}</th><th>{t('members')}</th><th>{t('plan')}</th><th>{t('status')}</th><th>{t('created')}</th></tr></thead><tbody>{teams.data?.items.map((team) => <tr key={team.id}><td><strong>{team.name}</strong></td><td>{team.owner?.email ?? '—'}</td><td>{team.memberCount}</td><td><select className={`plan-select ${team.planName}`} value={team.planName} onChange={(event) => updateTeam.mutate({ id: team.id, data: { planName: event.target.value as PlanName } })}><option value="free">Free</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select></td><td><select className={`status-select ${team.status}`} value={team.status} onChange={(event) => updateTeam.mutate({ id: team.id, data: { status: event.target.value as AccountStatus } })}><option value="active">{t('active')}</option><option value="suspended">{t('suspended')}</option></select></td><td>{formatDate(team.createdAt, locale)}</td></tr>)}</tbody></table>{!teams.isLoading && !teams.data?.items.length && <p className="empty-state">{t('noResults')}</p>}<Pagination page={teamPage} totalPages={teams.data?.totalPages ?? 0} onChange={setTeamPage} /></div></section>}
      {section === 'users' && <section className="admin-content"><div className="toolbar"><label className="search-box"><Search size={17} /><input value={userSearch} onChange={(event) => { setUserSearch(event.target.value); setUserPage(1) }} placeholder={t('searchUsers')} /></label><select value={userStatus} onChange={(event) => { setUserStatus(event.target.value); setUserPage(1) }}><option value="">{t('allStatuses')}</option><option value="active">{t('active')}</option><option value="suspended">{t('suspended')}</option></select></div>{users.error && <p className="query-error">{t('error')}</p>}<div className="panel table-panel"><table><thead><tr><th>{t('name')}</th><th>{t('team')}</th><th>{t('role')}</th><th>{t('status')}</th><th>{t('created')}</th></tr></thead><tbody>{users.data?.items.map((item) => <tr key={item.id}><td><strong>{item.firstName} {item.lastName}</strong><small>{item.email}</small></td><td>{item.team?.name ?? '—'}</td><td>{item.isSuperadmin ? 'Superadmin' : item.role}</td><td>{item.isSuperadmin ? <span className="protected-status">{t('protected')}</span> : <select className={`status-select ${item.status}`} value={item.status} onChange={(event) => updateUser.mutate({ id: item.id, status: event.target.value as AccountStatus })}><option value="active">{t('active')}</option><option value="suspended">{t('suspended')}</option></select>}</td><td>{formatDate(item.createdAt, locale)}</td></tr>)}</tbody></table>{!users.isLoading && !users.data?.items.length && <p className="empty-state">{t('noResults')}</p>}<Pagination page={userPage} totalPages={users.data?.totalPages ?? 0} onChange={setUserPage} /></div></section>}
    </main>
  </div>
}

function Metric({ title, value, icon }: { title: string; value: number | undefined; icon: React.ReactNode }) {
  return <section className="metric"><span>{icon}</span><div><small>{title}</small><strong>{value ?? '—'}</strong></div></section>
}
