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
import { useI18n } from '../i18n/locale'

export default function Identities() {
  const qc = useQueryClient()
  const { t } = useI18n()
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
    <div className="space-y-8">
      <div className="bankco-page-header">
        <div>
          <p className="bankco-eyebrow">{t('People directory')}</p>
          <h1 className="bankco-page-title">{t('Identities')}</h1>
          <p className="bankco-page-description">{t('Manage confirmed people profiles for this workspace.')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />{t('Create Identity')}</Button>
      </div>

      <div className="bankco-panel flex items-center gap-3 p-3 sm:p-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a0aec0]" />
          <input
            placeholder={t('Search identities...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-[#edf2f7] bg-[#f7fafc] py-2.5 pl-11 pr-4 text-sm font-medium text-[#2d3748] placeholder:text-[#a0aec0] focus:border-primary-500 focus:bg-white focus:outline-none"
          />
        </div>
        <div className="flex overflow-hidden rounded-lg border border-[#edf2f7] bg-white">
          <button aria-label={t('Grid view')} title={t('Grid view')} onClick={() => setView('grid')} className={clsx('grid h-10 w-10 place-items-center transition-colors', view === 'grid' ? 'bg-[#d9fbe6] text-primary-600' : 'text-[#a0aec0] hover:bg-[#f7fafc]')}>
            <Grid className="w-4 h-4" />
          </button>
          <button aria-label={t('List view')} title={t('List view')} onClick={() => setView('list')} className={clsx('grid h-10 w-10 place-items-center transition-colors', view === 'list' ? 'bg-[#d9fbe6] text-primary-600' : 'text-[#a0aec0] hover:bg-[#f7fafc]')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={clsx('grid gap-4', view === 'grid' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1')}>
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !data?.items.length ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title={t('No identities yet')} description={t('Create your first identity to start organizing faces.')} action={<Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />{t('Create Identity')}</Button>} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {data.items.map(id => (
            <Link key={id._id} to={`/identities/${id._id}`}>
              <Card className="h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-[0_14px_28px_rgba(42,49,60,.08)]">
                <CardContent className="p-5">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-2xl bg-[#f7fafc] p-1"><Avatar name={id.name} size="lg" /></div>
                    <h3 className="mt-4 font-bankco-display font-semibold tracking-[-.03em] text-[#2d3748]">{id.name}</h3>
                    {id.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#718096]">{id.description}</p>}
                    <div className="mt-3"><Badge variant="blue">{t('{{count}} faces', { count: id.faceCount })}</Badge></div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-[#edf2f7]">
            {data.items.map(id => (
              <Link key={id._id} to={`/identities/${id._id}`} className="flex items-center gap-4 p-5 transition-colors hover:bg-[#fafcfa]">
                <Avatar name={id.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-bankco-display font-semibold tracking-[-.02em] text-[#2d3748]">{id.name}</p>
                  {id.description && <p className="truncate text-sm text-[#718096]">{id.description}</p>}
                </div>
                <Badge variant="blue">{t('{{count}} faces', { count: id.faceCount })}</Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t('Create Identity')}>
        <div className="space-y-4">
          <Input label={t('Name')} placeholder={t("Person's name")} value={newName} onChange={e => setNewName(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#4a5568]">{t('Description (optional)')}</label>
            <textarea
              placeholder={t('Brief description')}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#2d3748] focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!newName.trim()}>{t('Create')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
