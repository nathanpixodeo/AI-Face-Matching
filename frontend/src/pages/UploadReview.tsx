import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { CardSkeleton } from '../components/ui/Skeleton'
import { ArrowLeft, Check } from 'lucide-react'
import { useI18n } from '../i18n/locale'

function UploadReviewPage() {
  const { t } = useI18n()
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

  if (isLoading) return <div className="grid grid-cols-3 gap-5"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>

  const allFaces = batch?.images?.flatMap(img => img.faces || []) || []
  const mapped = allFaces.filter(f => f.status === 'confirmed' || f.status === 'matched').length
  const unmatched = allFaces.filter(f => f.status === 'unmatched').length

  return (
    <div className="space-y-8">
      <div className="bankco-page-header">
        <div>
          <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm font-bold text-[#718096] transition-colors hover:text-primary-600"><ArrowLeft className="h-4 w-4" />{t('Back')}</button>
          <p className="bankco-eyebrow">{t('Quality control')}</p>
          <h1 className="bankco-page-title">{t('Review face mappings')}</h1>
          <p className="bankco-page-description">{t('Confirm or adjust detected face assignments.')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="green">{t('{{count}} mapped', { count: mapped })}</Badge>
          <Badge variant="orange">{t('{{count}} unmatched', { count: unmatched })}</Badge>
          <Button onClick={() => submit.mutate()} loading={submit.isPending}>{t('Save & Complete')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {allFaces.map(face => (
          <Card key={face._id} className={clsx(
            'overflow-hidden border-2 transition-all',
            skipped.has(face._id) ? 'border-[#edf2f7] opacity-50' :
            face.status === 'confirmed' || assignments[face._id] ? 'border-primary-300 shadow-[0_10px_20px_rgba(34,197,94,.08)]' :
            face.status === 'unmatched' ? 'border-[#ffb6a5]' : 'border-[#edf2f7]'
          )}>
            <div className="relative aspect-square bg-[#edf2f7]">
              <img src={`/api/images/${face.image?._id}/file?crop=${face.bbox.x},${face.bbox.y},${face.bbox.width},${face.bbox.height}`}
                alt="" className="w-full h-full object-cover" />
            </div>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-[#718096]">
                <span>{Math.round(face.age)}y</span>
                <span>{face.gender}</span>
                <span>{Math.round(face.confidence * 100)}%</span>
              </div>

              {face.identity || assignments[face._id] ? (
                <div className="flex items-center gap-1 text-xs font-bold text-success-600">
                  <Check className="w-3 h-3" />
                  {assignments[face._id] ? identities?.items?.find(i => i._id === assignments[face._id])?.name || t('Assigned') : face.identity?.name}
                </div>
              ) : (
                <div className="text-xs font-bold text-accent-500">{t('No match found')}</div>
              )}

              <div className="flex gap-1 pt-1">
                {!assignments[face._id] && !skipped.has(face._id) && (
                  <select
                    className="flex-1 rounded-lg border border-[#e2e8f0] bg-white px-2 py-2 text-xs font-medium text-[#4a5568] outline-none focus:border-primary-500"
                    value=""
                    onChange={e => {
                      if (e.target.value === 'skip') { setSkipped(prev => new Set(prev).add(face._id)) }
                      else if (e.target.value) { setAssignments(prev => ({ ...prev, [face._id]: e.target.value })) }
                    }}
                  >
                    <option value="" disabled>{t('Assign...')}</option>
                    <option value="skip">{t('Skip')}</option>
                    {identities?.items?.map(id => (
                      <option key={id._id} value={id._id}>{id.name}</option>
                    ))}
                  </select>
                )}
                {skipped.has(face._id) && (
                  <button onClick={() => setSkipped(prev => { const n = new Set(prev); n.delete(face._id); return n })} className="text-xs font-bold text-primary-600">
                    {t('Undo skip')}
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
