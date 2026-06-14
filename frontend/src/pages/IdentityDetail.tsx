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

export default function IdentityDetail() {
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

  if (isLoading) return <div className="grid grid-cols-3 gap-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
  if (!identity) return null

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/identities')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Identities
      </button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar name={identity.name} size="lg" />
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3 max-w-md">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} label="Name" />
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      rows={2}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => update.mutate()} loading={update.isPending}>Save</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">{identity.name}</h1>
                    <button onClick={() => { setEditName(identity.name); setEditDesc(identity.description || ''); setEditing(true) }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteOpen(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {identity.description && <p className="text-sm text-gray-500 mt-1">{identity.description}</p>}
                </>
              )}
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="blue">{identity.faceCount} faces</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold">Linked Faces</h2>
      {faces?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {faces.map(face => (
            <Card key={face._id} className="overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                <img src={`/api/images/${face.image?._id}/file`} alt="" className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-3 space-y-1">
                <p className="text-xs text-gray-500 truncate">{face.image?.originalName}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{Math.round(face.age)}y</span>
                  <span className="text-xs text-gray-500">{face.gender}</span>
                </div>
                <Badge variant={face.status === 'confirmed' ? 'green' : face.status === 'matched' ? 'blue' : 'orange'}>
                  {face.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-gray-500">No faces linked to this identity.</div>
      )}

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Identity" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          This will unlink all {identity.faceCount} faces from this identity. The faces will remain in the library as unmatched.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => remove.mutate()} loading={remove.isPending}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
