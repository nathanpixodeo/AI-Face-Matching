import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Avatar } from '../components/ui/Avatar'
import { CardSkeleton } from '../components/ui/Skeleton'
import { ArrowLeft, Edit3, Trash2 } from 'lucide-react'
import { useI18n } from '../i18n/locale'

export default function IdentityDetail() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: identity, isLoading } = useQuery({
    queryKey: ['identity', id],
    queryFn: () => api.identities.get(id!),
    enabled: !!id,
  })

  const { data: faces } = useQuery({
    queryKey: ['identity-faces', id],
    queryFn: () => api.identities.faces(id!),
    enabled: !!id,
  })

  const update = useMutation({
    mutationFn: () => api.identities.update(id!, { name: editName, description: editDesc }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['identity', id] }); setEditing(false) },
  })

  const remove = useMutation({
    mutationFn: () => api.identities.delete(id!),
    onSuccess: () => navigate('/identities'),
  })

  if (isLoading) return <div className="grid grid-cols-3 gap-5"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
  if (!identity) return null

  return (
    <div className="space-y-8">
      <button onClick={() => navigate('/identities')} className="flex items-center gap-2 text-sm font-bold text-[#718096] transition-colors hover:text-primary-600">
        <ArrowLeft className="h-4 w-4" /> {t('Back to identities')}
      </button>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row">
            <div className="rounded-2xl bg-[#f7fafc] p-1"><Avatar name={identity.name} size="lg" /></div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3 max-w-md">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} label={t('Name')} />
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-[#4a5568]">{t('Description')}</label>
                    <textarea
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      rows={2}
                      className="block w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#2d3748] focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => update.mutate()} loading={update.isPending}>{t('Save')}</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>{t('Cancel')}</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="bankco-eyebrow">{t('Identity profile')}</p>
                  <div className="flex items-center gap-3">
                    <h1 className="font-bankco-display text-2xl font-semibold tracking-[-.04em] text-[#1a202c]">{identity.name}</h1>
                    <button aria-label={t('Edit {{name}}', { name: identity.name })} onClick={() => { setEditName(identity.name); setEditDesc(identity.description || ''); setEditing(true) }} className="bankco-icon-button h-8 w-8 border-0">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button aria-label={t('Delete {{name}}', { name: identity.name })} onClick={() => setDeleteOpen(true)} className="bankco-icon-button h-8 w-8 border-0 hover:bg-danger-50 hover:text-danger-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {identity.description && <p className="mt-2 text-sm leading-6 text-[#718096]">{identity.description}</p>}
                </>
              )}
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="blue">{t('{{count}} faces', { count: identity.faceCount })}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bankco-panel-header rounded-xl border border-[#edf2f7] bg-white"><div><p className="bankco-eyebrow">{t('Reference images')}</p><h2 className="font-bankco-display text-lg font-semibold tracking-[-.03em] text-[#1a202c]">{t('Linked faces')}</h2></div><Badge variant="blue">{t('{{count}} total', { count: identity.faceCount })}</Badge></div>
      {faces?.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {faces.map(face => (
            <Card key={face._id} className="overflow-hidden transition-transform hover:-translate-y-0.5">
              <div className="relative aspect-square bg-[#edf2f7]">
                <img src={`/api/images/${face.image?._id}/file`} alt="" className="w-full h-full object-cover" />
              </div>
              <CardContent className="space-y-2 p-4">
                <p className="truncate text-xs font-medium text-[#718096]">{face.image?.originalName}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#718096]">{Math.round(face.age)}y</span>
                  <span className="text-xs text-[#718096]">{face.gender}</span>
                </div>
                <Badge variant={face.status === 'confirmed' ? 'green' : face.status === 'matched' ? 'blue' : 'orange'}>
                  {t(face.status.charAt(0).toUpperCase() + face.status.slice(1))}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bankco-panel py-12 text-center text-sm text-[#718096]">{t('No faces linked to this identity.')}</div>
      )}

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t('Delete Identity')} size="sm">
        <p className="text-sm text-gray-600 mb-6">
          {t('This will unlink all {{count}} faces from this identity. The faces will remain in the library as unmatched.', { count: identity.faceCount })}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>{t('Cancel')}</Button>
          <Button variant="danger" onClick={() => remove.mutate()} loading={remove.isPending}>{t('Delete')}</Button>
        </div>
      </Modal>
    </div>
  )
}
