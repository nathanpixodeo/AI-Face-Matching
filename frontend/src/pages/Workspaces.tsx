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

export default function Workspaces() {
  const qc = useQueryClient()
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
          <p className="text-sm text-gray-500 mt-1">Organize your face recognition projects</p>
        </div>
        <Button onClick={() => { setName(''); setNotes(''); setCreateOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />Create Workspace
        </Button>
      </div>

      {isLoading ? <TableSkeleton /> : !workspaces?.length ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-gray-500">
            No workspaces yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-gray-100">
            {workspaces.map(ws => (
              <div key={ws._id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{ws.name}</p>
                  {ws.notes && <p className="text-sm text-gray-500 truncate">{ws.notes}</p>}
                </div>
                <Badge variant={ws.status === 'active' ? 'green' : 'gray'}>{ws.status}</Badge>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggle.mutate(ws)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                    {ws.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(ws)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove.mutate(ws._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Workspace">
        <div className="space-y-4">
          <Input label="Name" placeholder="Workspace name" value={name} onChange={e => setName(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!name.trim()}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Workspace">
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={e => setName(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => update.mutate()} loading={update.isPending}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
