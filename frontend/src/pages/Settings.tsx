import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { ProgressBar } from '../components/ui/ProgressBar'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Copy, Check, Trash2, UserPlus } from 'lucide-react'
import { useI18n } from '../i18n/locale'

type Tab = 'general' | 'members' | 'plan'

export default function Settings() {
  const qc = useQueryClient()
  const { locale, t } = useI18n()
  const [tab, setTab] = useState<Tab>('general')
  const [teamName, setTeamName] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [copied, setCopied] = useState(false)

  const { data: team } = useQuery({
    queryKey: ['team'],
    queryFn: api.team.get,
  })

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: api.team.members.list,
  })

  const updateTeam = useMutation({
    mutationFn: () => api.team.update({ name: teamName }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  })

  const invite = useMutation({
    mutationFn: () => api.team.members.add({ email: inviteEmail, role: inviteRole }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); setInviteOpen(false); setInviteEmail('') },
  })

  const removeMember = useMutation({
    mutationFn: (id: string) => api.team.members.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  })

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.team.members.update(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  })

  const tabs: { key: Tab; label: string }[] = [
    { key: 'general', label: t('General') },
    { key: 'members', label: t('Members') },
    { key: 'plan', label: t('Plan & Usage') },
  ]

  return (
    <div className="max-w-5xl space-y-8">
      <div className="bankco-page-header">
        <div>
          <p className="bankco-eyebrow">{t('Workspace control')}</p>
          <h1 className="bankco-page-title">{t('Settings')}</h1>
          <p className="bankco-page-description">{t('Manage your team, people, plan, and account access.')}</p>
        </div>
      </div>

      <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-[#edf2f7] bg-white p-1.5 sm:w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${tab === t.key ? 'bg-[#d9fbe6] text-[#15803d]' : 'text-[#718096] hover:bg-[#f7fafc] hover:text-[#2d3748]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <Card>
          <CardHeader><div><p className="bankco-eyebrow">{t('Workspace profile')}</p><h2 className="font-bankco-display font-semibold tracking-[-.03em] text-[#1a202c]">{t('General settings')}</h2></div></CardHeader>
          <CardContent className="space-y-4">
            {team && (
              <div className="space-y-4 max-w-md">
                <Input label={t('Team Name')} value={teamName || team.name} onChange={e => setTeamName(e.target.value)} />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-[#4a5568]">{t('Team ID')}</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-[#f7fafc] px-4 py-3 text-sm text-[#4a5568]">{team._id}</code>
                    <button onClick={() => { navigator.clipboard.writeText(team._id); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                      className="bankco-icon-button">
                      {copied ? <Check className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={() => updateTeam.mutate()} loading={updateTeam.isPending}>{t('Save Changes')}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'members' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div><p className="bankco-eyebrow">{t('Access control')}</p><h2 className="font-bankco-display font-semibold tracking-[-.03em] text-[#1a202c]">{t('Team members')}</h2></div>
            <Button size="sm" onClick={() => setInviteOpen(true)}><UserPlus className="w-4 h-4 mr-2" />{t('Invite')}</Button>
          </CardHeader>
          <CardContent>
            {!members ? <TableSkeleton /> : (
              <div className="divide-y divide-[#edf2f7]">
                {members.map(m => (
                  <div key={m._id} className="flex flex-wrap items-center gap-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a202c] text-sm font-bold text-white">
                      {m.user?.first_name?.[0]}{m.user?.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#2d3748]">{m.user?.first_name} {m.user?.last_name}</p>
                      <p className="text-xs text-[#718096]">{m.user?.email}</p>
                    </div>
                    <Badge variant={m.role === 'owner' ? 'blue' : m.role === 'admin' ? 'yellow' : 'gray'}>{t(m.role.charAt(0).toUpperCase() + m.role.slice(1))}</Badge>
                    <div className="text-xs font-medium text-[#a0aec0]">{new Date(m.joinedAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : locale === 'fr' ? 'fr-FR' : 'en-US')}</div>
                    {m.role !== 'owner' && (
                      <select value={m.role} onChange={e => changeRole.mutate({ id: m._id, role: e.target.value })}
                        className="rounded-lg border border-[#e2e8f0] bg-white px-2 py-1.5 text-xs font-bold text-[#4a5568] outline-none focus:border-primary-500">
                        <option value="member">{t('Member')}</option>
                        <option value="admin">{t('Admin')}</option>
                      </select>
                    )}
                    {m.role !== 'owner' && (
                      <button aria-label={t('Remove {{name}}', { name: m.user?.email || '' })} onClick={() => removeMember.mutate(m._id)} className="bankco-icon-button h-8 w-8 border-0 hover:bg-danger-50 hover:text-danger-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'plan' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><div><p className="bankco-eyebrow">{t('Subscription')}</p><h2 className="font-bankco-display font-semibold tracking-[-.03em] text-[#1a202c]">{t('Current plan')}</h2></div></CardHeader>
            <CardContent>
              {team && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bankco-display text-xl font-semibold capitalize tracking-[-.03em] text-[#1a202c]">{team.plan}</p>
                    <p className="mt-1 text-sm text-[#718096]">
                      {team.plan === 'free' && t('Free plan with basic features')}
                      {team.plan === 'pro' && t('$29/month - Professional features')}
                      {team.plan === 'enterprise' && t('$99/month - Unlimited everything')}
                    </p>
                  </div>
                  {team.plan === 'free' && (
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => api.team.plan('pro')}>{t('Upgrade to Pro')}</Button>
                      <Button onClick={() => api.team.plan('enterprise')}>{t('Enterprise')}</Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><p className="bankco-eyebrow">{t('Capacity')}</p><h2 className="font-bankco-display font-semibold tracking-[-.03em] text-[#1a202c]">{t('Usage')}</h2></div></CardHeader>
            <CardContent>
              {team && (
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-[#718096]">{t('Identities')}</span><span className="font-bold text-[#4a5568]">{team.usage.identities} / {team.limits.identities === Infinity ? '∞' : team.limits.identities}</span></div>
                    <ProgressBar value={team.usage.identities} max={team.limits.identities === Infinity ? 1 : team.limits.identities} variant={team.usage.identities > team.limits.identities * 0.9 ? 'red' : team.usage.identities > team.limits.identities * 0.7 ? 'yellow' : 'primary'} size="sm" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-[#718096]">{t('Images')}</span><span className="font-bold text-[#4a5568]">{team.usage.images} / {team.limits.images === Infinity ? '∞' : team.limits.images}</span></div>
                    <ProgressBar value={team.usage.images} max={team.limits.images === Infinity ? 1 : team.limits.images} variant={team.usage.images > team.limits.images * 0.9 ? 'red' : team.usage.images > team.limits.images * 0.7 ? 'yellow' : 'green'} size="sm" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-[#718096]">{t('Matches today')}</span><span className="font-bold text-[#4a5568]">{team.usage.matchesToday} / {team.limits.matchesPerDay === Infinity ? '∞' : team.limits.matchesPerDay}</span></div>
                    <ProgressBar value={team.usage.matchesToday} max={team.limits.matchesPerDay === Infinity ? 1 : team.limits.matchesPerDay} variant={team.usage.matchesToday > team.limits.matchesPerDay * 0.9 ? 'red' : 'yellow'} size="sm" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-[#718096]">{t('Storage')}</span><span className="font-bold text-[#4a5568]">{(team.usage.storage / 1048576).toFixed(0)}MB / {team.limits.storage === Infinity ? '∞' : `${(team.limits.storage / 1048576).toFixed(0)}MB`}</span></div>
                    <ProgressBar value={team.usage.storage / 1048576} max={team.limits.storage === Infinity ? 1 : team.limits.storage / 1048576} variant={team.usage.storage > team.limits.storage * 0.9 ? 'red' : 'primary'} size="sm" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title={t('Invite Member')}>
        <div className="space-y-4">
          <Input label={t('Email')} type="email" placeholder="colleague@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#4a5568]">{t('Role')}</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              className="block min-h-12 w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-sm font-medium text-[#4a5568] focus:border-primary-500 focus:outline-none">
              <option value="member">{t('Member')}</option>
              <option value="admin">{t('Admin')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={() => invite.mutate()} loading={invite.isPending} disabled={!inviteEmail.trim()}>{t('Send Invite')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
