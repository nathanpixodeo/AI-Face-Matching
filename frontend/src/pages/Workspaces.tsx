import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Plus, Power, PowerOff, Edit3, Trash2 } from 'lucide-react'
import type { Workspace } from '../types'
import { useI18n } from '../i18n/locale'

export default function Workspaces() {
  const qc = useQueryClient()
  const { t } = useI18n()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState<Workspace | null>(null)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: api.workspaces.list,
  })

  const create = useMutation({
    mutationFn: () => api.workspaces.create({ name, notes: notes || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workspaces'] }); setCreateOpen(false); setName(''); setNotes('') },
  })

  const update = useMutation({
    mutationFn: () => api.workspaces.update(editItem!._id, { name, notes: notes || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workspaces'] }); setEditOpen(false) },
  })

  const toggle = useMutation({
    mutationFn: (ws: Workspace) => api.workspaces.update(ws._id, { status: ws.status === 'active' ? 'inactive' : 'active' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.workspaces.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })

  function openEdit(ws: Workspace) {
    setEditItem(ws)
    setName(ws.name)
    setNotes(ws.notes || '')
    setEditOpen(true)
  }

  return (
    <div className="space-y-8">
      <div className="bankco-page-header">
        <div>
          <p className="bankco-eyebrow">{t('Project organization')}</p>
          <h1 className="bankco-page-title">{t('Workspaces')}</h1>
          <p className="bankco-page-description">{t('Organize your face recognition projects.')}</p>
        </div>
        <Button onClick={() => { setName(''); setNotes(''); setCreateOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />{t('Create Workspace')}
        </Button>
      </div>

      {isLoading ? <TableSkeleton /> : !workspaces?.length ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-[#718096]">
            {t('No workspaces yet. Create one to get started.')}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-[#edf2f7]">
            {workspaces.map(ws => (
              <div key={ws._id} className="flex items-center gap-4 p-5 transition-colors hover:bg-[#fafcfa]">
                <div className="hidden h-10 w-1 rounded-full bg-primary-100 sm:block" />
                <div className="flex-1 min-w-0">
                  <p className="font-bankco-display font-semibold tracking-[-.02em] text-[#2d3748]">{ws.name}</p>
                  {ws.notes && <p className="mt-1 truncate text-sm text-[#718096]">{ws.notes}</p>}
                </div>
                <Badge variant={ws.status === 'active' ? 'green' : 'gray'}>{t(ws.status.charAt(0).toUpperCase() + ws.status.slice(1))}</Badge>
                <div className="flex items-center gap-1">
                  <button aria-label={t('{{action}} {{name}}', { action: t(ws.status === 'active' ? 'Deactivate' : 'Activate'), name: ws.name })} onClick={() => toggle.mutate(ws)} className="bankco-icon-button h-8 w-8 border-0">
                    {ws.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                  <button aria-label={t('Edit {{name}}', { name: ws.name })} onClick={() => openEdit(ws)} className="bankco-icon-button h-8 w-8 border-0">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button aria-label={t('Delete {{name}}', { name: ws.name })} onClick={() => remove.mutate(ws._id)} className="bankco-icon-button h-8 w-8 border-0 hover:bg-danger-50 hover:text-danger-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t('Create Workspace')}>
        <div className="space-y-4">
          <Input label={t('Name')} placeholder={t('Workspace name')} value={name} onChange={e => setName(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#4a5568]">{t('Notes (optional)')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="block w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#2d3748] focus:border-primary-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!name.trim()}>{t('Create')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t('Edit Workspace')}>
        <div className="space-y-4">
          <Input label={t('Name')} value={name} onChange={e => setName(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#4a5568]">{t('Notes (optional)')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="block w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#2d3748] focus:border-primary-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={() => update.mutate()} loading={update.isPending}>{t('Save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
