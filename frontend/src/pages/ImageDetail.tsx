import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { CardSkeleton } from '../components/ui/Skeleton'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useI18n } from '../i18n/locale'

export default function ImageDetail() {
  const { locale, t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: image, isLoading } = useQuery({
    queryKey: ['image', id],
    queryFn: () => api.images.get(id!),
    enabled: !!id,
  })

  const remove = useMutation({
    mutationFn: () => api.images.delete(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['images'] }); navigate('/images') },
  })

  if (isLoading) return <div className="space-y-5"><CardSkeleton /><CardSkeleton /></div>
  if (!image) return null

  return (
    <div className="space-y-8">
      <div className="bankco-page-header">
        <div>
          <button onClick={() => navigate('/images')} className="mb-4 flex items-center gap-2 text-sm font-bold text-[#718096] transition-colors hover:text-primary-600"><ArrowLeft className="h-4 w-4" />{t('Back to images')}</button>
          <p className="bankco-eyebrow">{t('Image detail')}</p>
          <h1 className="bankco-page-title truncate">{image.originalName}</h1>
          <p className="bankco-page-description">{t('Inspect detected faces, processing status, and file metadata.')}</p>
        </div>
        <Badge variant={image.status === 'completed' ? 'green' : image.status === 'processing' ? 'yellow' : 'red'}>{t(image.status.charAt(0).toUpperCase() + image.status.slice(1))}</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative bg-[#1a202c] p-3 sm:p-5">
              <img src={`/api/images/${image._id}/file`} alt={image.originalName} className="mx-auto max-h-[70vh] w-full rounded-lg object-contain" />
              {image.faces?.map((face, i) => (
                <div
                  key={i}
                  className="absolute cursor-pointer border-2 border-primary-500 bg-primary-500/20 transition-colors hover:bg-primary-500/30"
                  style={{
                    left: `${face.bbox.x}%`,
                    top: `${face.bbox.y}%`,
                    width: `${face.bbox.width}%`,
                    height: `${face.bbox.height}%`,
                  }}
                  title={`${face.identity?.name || t('Unmatched')} (${Math.round(face.confidence * 100)}%)`}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-5 p-5">
              <div><p className="bankco-eyebrow">{t('File metadata')}</p><h2 className="font-bankco-display text-lg font-semibold tracking-[-.03em] text-[#1a202c]">{t('Image info')}</h2></div>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4"><dt className="text-[#718096]">{t('Filename')}</dt><dd className="max-w-[60%] truncate text-right font-bold text-[#2d3748]">{image.originalName}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-[#718096]">{t('Size')}</dt><dd className="font-bold text-[#2d3748]">{(image.size / 1024 / 1024).toFixed(2)} MB</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-[#718096]">{t('Dimensions')}</dt><dd className="font-bold text-[#2d3748]">{image.width}×{image.height}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-[#718096]">{t('Uploaded')}</dt><dd className="font-bold text-[#2d3748]">{new Date(image.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : locale === 'fr' ? 'fr-FR' : 'en-US')}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-[#718096]">{t('Faces')}</dt><dd className="font-bold text-[#2d3748]">{image.faceCount}</dd></div>
              </dl>
              <Button variant="danger" className="w-full" onClick={() => remove.mutate()} loading={remove.isPending}><Trash2 className="h-4 w-4" />{t('Delete image')}</Button>
            </CardContent>
          </Card>

          {image.faces?.length ? <Card>
            <CardContent className="space-y-3 p-5">
              <div><p className="bankco-eyebrow">{t('Detection output')}</p><h2 className="font-bankco-display font-semibold tracking-[-.03em] text-[#1a202c]">{t('Detected faces')}</h2></div>
              <div className="divide-y divide-[#edf2f7]">
                {image.faces.map((face, i) => <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#edf2f7]">{face.image && <img src={`/api/images/${face.image._id}/file`} alt="" className="h-full w-full object-cover" />}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#2d3748]">{face.identity?.name || t('Unmatched')}</p><p className="mt-0.5 text-xs text-[#718096]">{Math.round(face.age)}y · {face.gender}</p></div>
                  <Badge variant={face.status === 'confirmed' ? 'green' : face.status === 'matched' ? 'blue' : 'orange'}>{t(face.status.charAt(0).toUpperCase() + face.status.slice(1))}</Badge>
                </div>)}
              </div>
            </CardContent>
          </Card> : null}
        </div>
      </div>
    </div>
  )
}
