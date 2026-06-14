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

type Tab = 'general' | 'members' | 'plan'

export default function Settings() {
  const qc = useQueryClient()
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
    { key: 'general', label: 'General' },
    { key: 'members', label: 'Members' },
    { key: 'plan', label: 'Plan & Usage' },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your team and account</p>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <Card>
          <CardHeader><h2 className="font-semibold">General Settings</h2></CardHeader>
          <CardContent className="space-y-4">
            {team && (
              <div className="space-y-4 max-w-md">
                <Input label="Team Name" value={teamName || team.name} onChange={e => setTeamName(e.target.value)} />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Team ID</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 font-mono">{team._id}</code>
                    <button onClick={() => { navigator.clipboard.writeText(team._id); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                      {copied ? <Check className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={() => updateTeam.mutate()} loading={updateTeam.isPending}>Save Changes</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'members' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold">Team Members</h2>
            <Button size="sm" onClick={() => setInviteOpen(true)}><UserPlus className="w-4 h-4 mr-2" />Invite</Button>
          </CardHeader>
          <CardContent>
            {!members ? <TableSkeleton /> : (
              <div className="divide-y divide-gray-100">
                {members.map(m => (
                  <div key={m._id} className="flex items-center gap-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                      {m.user?.first_name?.[0]}{m.user?.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{m.user?.first_name} {m.user?.last_name}</p>
                      <p className="text-xs text-gray-500">{m.user?.email}</p>
                    </div>
                    <Badge variant={m.role === 'owner' ? 'blue' : m.role === 'admin' ? 'yellow' : 'gray'}>{m.role}</Badge>
                    <div className="text-xs text-gray-400">{new Date(m.joinedAt).toLocaleDateString()}</div>
                    {m.role !== 'owner' && (
                      <select value={m.role} onChange={e => changeRole.mutate({ id: m._id, role: e.target.value })}
                        className="text-xs rounded border border-gray-300 px-2 py-1">
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    {m.role !== 'owner' && (
                      <button onClick={() => removeMember.mutate(m._id)} className="p-1 rounded text-gray-400 hover:text-red-500">
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
            <CardHeader><h2 className="font-semibold">Current Plan</h2></CardHeader>
            <CardContent>
              {team && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold capitalize text-gray-900">{team.plan}</p>
                    <p className="text-sm text-gray-500">
                      {team.plan === 'free' && 'Free plan with basic features'}
                      {team.plan === 'pro' && '$29/month - Professional features'}
                      {team.plan === 'enterprise' && '$99/month - Unlimited everything'}
                    </p>
                  </div>
                  {team.plan === 'free' && (
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => api.team.plan('pro')}>Upgrade to Pro</Button>
                      <Button onClick={() => api.team.plan('enterprise')}>Enterprise</Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Usage</h2></CardHeader>
            <CardContent>
              {team && (
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Identities</span><span className="font-medium">{team.usage.identities} / {team.limits.identities === Infinity ? '∞' : team.limits.identities}</span></div>
                    <ProgressBar value={team.usage.identities} max={team.limits.identities === Infinity ? 1 : team.limits.identities} variant={team.usage.identities > team.limits.identities * 0.9 ? 'red' : team.usage.identities > team.limits.identities * 0.7 ? 'yellow' : 'primary'} size="sm" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Images</span><span className="font-medium">{team.usage.images} / {team.limits.images === Infinity ? '∞' : team.limits.images}</span></div>
                    <ProgressBar value={team.usage.images} max={team.limits.images === Infinity ? 1 : team.limits.images} variant={team.usage.images > team.limits.images * 0.9 ? 'red' : team.usage.images > team.limits.images * 0.7 ? 'yellow' : 'green'} size="sm" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Matches today</span><span className="font-medium">{team.usage.matchesToday} / {team.limits.matchesPerDay === Infinity ? '∞' : team.limits.matchesPerDay}</span></div>
                    <ProgressBar value={team.usage.matchesToday} max={team.limits.matchesPerDay === Infinity ? 1 : team.limits.matchesPerDay} variant={team.usage.matchesToday > team.limits.matchesPerDay * 0.9 ? 'red' : 'yellow'} size="sm" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Storage</span><span className="font-medium">{(team.usage.storage / 1048576).toFixed(0)}MB / {team.limits.storage === Infinity ? '∞' : `${(team.limits.storage / 1048576).toFixed(0)}MB`}</span></div>
                    <ProgressBar value={team.usage.storage / 1048576} max={team.limits.storage === Infinity ? 1 : team.limits.storage / 1048576} variant={team.usage.storage > team.limits.storage * 0.9 ? 'red' : 'primary'} size="sm" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Member">
        <div className="space-y-4">
          <Input label="Email" type="email" placeholder="colleague@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={() => invite.mutate()} loading={invite.isPending} disabled={!inviteEmail.trim()}>Send Invite</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
