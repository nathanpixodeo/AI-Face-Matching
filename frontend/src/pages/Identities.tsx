import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Avatar } from '../components/ui/Avatar'
import { CardSkeleton } from '../components/ui/Skeleton'
import { useDebounce, usePagination } from '../hooks/useUtils'
import { Users, Plus, Search, Grid, List } from 'lucide-react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

export default function Identities() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const { page, limit } = usePagination()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['identities', page, debouncedSearch],
    queryFn: () => api.identities.list({ page, limit, search: debouncedSearch }),
  })

  const create = useMutation({
    mutationFn: () => api.identities.create({ name: newName, description: newDesc || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['identities'] }); setCreateOpen(false); setNewName(''); setNewDesc('') },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Identities</h1>
          <p className="text-sm text-gray-500 mt-1">Manage known people profiles</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Identity</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search identities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button onClick={() => setView('grid')} className={clsx('p-2', view === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-50')}>
            <Grid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')} className={clsx('p-2', view === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-50')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={clsx('grid gap-4', view === 'grid' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1')}>
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !data?.items.length ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="No identities yet" description="Create your first identity to start organizing faces." action={<Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Identity</Button>} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {data.items.map(id => (
            <Link key={id._id} to={`/identities/${id._id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <Avatar name={id.name} size="lg" />
                    <h3 className="mt-3 font-semibold text-gray-900">{id.name}</h3>
                    {id.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{id.description}</p>}
                    <div className="mt-2"><Badge variant="blue">{id.faceCount} faces</Badge></div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-gray-100">
            {data.items.map(id => (
              <Link key={id._id} to={`/identities/${id._id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <Avatar name={id.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{id.name}</p>
                  {id.description && <p className="text-sm text-gray-500 truncate">{id.description}</p>}
                </div>
                <Badge variant="blue">{id.faceCount} faces</Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Identity">
        <div className="space-y-4">
          <Input label="Name" placeholder="Person's name" value={newName} onChange={e => setNewName(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
            <textarea
              placeholder="Brief description"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!newName.trim()}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
