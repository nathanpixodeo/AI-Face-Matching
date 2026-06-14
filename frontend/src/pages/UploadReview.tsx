import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { CardSkeleton } from '../components/ui/Skeleton'
import { ArrowLeft, Check } from 'lucide-react'

function UploadReviewPage() {
  const { batchId } = useParams<{ batchId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [skipped, setSkipped] = useState<Set<string>>(new Set())

  const { data: batch, isLoading } = useQuery({
    queryKey: ['batch-review', batchId],
    queryFn: () => api.uploads.review(batchId!),
    enabled: !!batchId,
  })

  const { data: identities } = useQuery({
    queryKey: ['identities'],
    queryFn: () => api.identities.list({ limit: 100 }),
  })

  const submit = useMutation({
    mutationFn: () => api.uploads.submitReview(batchId!, { assignments, skipped: Array.from(skipped) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batch-review', batchId] })
      navigate('/')
    },
  })

  if (isLoading) return <div className="grid grid-cols-3 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>

  const allFaces = batch?.images?.flatMap(img => img.faces || []) || []
  const mapped = allFaces.filter(f => f.status === 'confirmed' || f.status === 'matched').length
  const unmatched = allFaces.filter(f => f.status === 'unmatched').length

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Face Mappings</h1>
          <p className="text-sm text-gray-500 mt-1">Confirm or adjust detected face assignments</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="green">{mapped} mapped</Badge>
          <Badge variant="orange">{unmatched} unmatched</Badge>
          <Button onClick={() => submit.mutate()} loading={submit.isPending}>Save & Complete</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {allFaces.map(face => (
          <Card key={face._id} className={clsx(
            'overflow-hidden border-2 transition-all',
            skipped.has(face._id) ? 'border-gray-200 opacity-50' :
            face.status === 'confirmed' || assignments[face._id] ? 'border-success-500' :
            face.status === 'unmatched' ? 'border-orange-400' : 'border-gray-200'
          )}>
            <div className="aspect-square bg-gray-100 relative">
              <img src={`/api/images/${face.image?._id}/file?crop=${face.bbox.x},${face.bbox.y},${face.bbox.width},${face.bbox.height}`}
                alt="" className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{Math.round(face.age)}y</span>
                <span>{face.gender}</span>
                <span>{Math.round(face.confidence * 100)}%</span>
              </div>

              {face.identity || assignments[face._id] ? (
                <div className="text-xs font-medium text-success-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {assignments[face._id] ? identities?.items?.find(i => i._id === assignments[face._id])?.name || 'Assigned' : face.identity?.name}
                </div>
              ) : (
                <div className="text-xs text-orange-500">No match found</div>
              )}

              <div className="flex gap-1 pt-1">
                {!assignments[face._id] && !skipped.has(face._id) && (
                  <select
                    className="flex-1 text-xs rounded border border-gray-300 px-1 py-1"
                    value=""
                    onChange={e => {
                      if (e.target.value === 'skip') { setSkipped(prev => new Set(prev).add(face._id)) }
                      else if (e.target.value) { setAssignments(prev => ({ ...prev, [face._id]: e.target.value })) }
                    }}
                  >
                    <option value="" disabled>Assign...</option>
                    <option value="skip">Skip</option>
                    {identities?.items?.map(id => (
                      <option key={id._id} value={id._id}>{id.name}</option>
                    ))}
                  </select>
                )}
                {skipped.has(face._id) && (
                  <button onClick={() => setSkipped(prev => { const n = new Set(prev); n.delete(face._id); return n })} className="text-xs text-primary-600">
                    Undo skip
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function clsx(...args: (string | false | null | undefined)[]) {
  return args.filter(Boolean).join(' ')
}

export default UploadReviewPage
