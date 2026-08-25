import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useToast } from '../contexts/ToastContext'
import { Upload, X, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { useI18n } from '../i18n/locale'

export default function UploadPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: batch, isError: progressErr, refetch: retryProgress } = useQuery({
    queryKey: ['batch-progress', batchId],
    queryFn: () => api.uploads.batch(batchId!),
    enabled: !!batchId,
    refetchInterval: (query) => {
      const d = query.state.data
      if (d?.status === 'completed' || d?.status === 'failed' || d?.status === 'review') return false
      return 2000
    },
  })

  const uploadMutation = useMutation({
    mutationFn: () => api.uploads.upload(files),
    onSuccess: (data) => {
      setBatchId(data._id)
      toast('success', t('{{count}} files uploaded successfully', { count: files.length }))
    },
    onError: (err: Error) => {
      toast('error', err.message || t('Upload failed'))
    },
  })

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'].includes(f.type))
    if (!dropped.length) { toast('error', t('Unsupported file type. Accepted: JPG, PNG, WEBP, BMP')); return }
    setFiles(prev => [...prev, ...dropped])
  }, [t, toast])

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index))

  const progress = batch ? {
    total: batch.imageCount,
    processed: batch.facesDetected + batch.facesUnmatched + batch.facesMapped,
    pct: batch.imageCount ? Math.round(((batch.facesDetected + batch.facesUnmatched + batch.facesMapped) / batch.imageCount) * 100) : 0,
  } : null

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="bankco-page-header">
        <div>
          <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm font-bold text-[#718096] transition-colors hover:text-primary-600"><ArrowLeft className="h-4 w-4" />{t('Back')}</button>
          <p className="bankco-eyebrow">{t('Image intake')}</p>
          <h1 className="bankco-page-title">{t('Upload images')}</h1>
          <p className="bankco-page-description">{t('Add a batch for face detection and review.')}</p>
        </div>
        {!batchId && <div className="hidden rounded-lg bg-[#f7fafc] px-4 py-3 text-right sm:block"><p className="text-xs font-bold uppercase tracking-[.08em] text-[#718096]">{t('Accepted files')}</p><p className="mt-1 text-sm font-bold text-[#4a5568]">JPG · PNG · WEBP · BMP</p></div>}
      </div>

      {!batchId && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          data-active={dragging}
          className={clsx(
            'bankco-dropzone cursor-pointer px-6 py-16 text-center transition-colors sm:py-20',
            dragging ? 'border-primary-500' : 'hover:border-primary-400'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/bmp"
            className="hidden"
            onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
          />
          <div className="relative z-10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-white text-primary-600 shadow-[0_10px_24px_rgba(42,49,60,.08)]">
            <Upload className="h-6 w-6" />
          </div>
          <p className="relative z-10 font-bankco-display text-xl font-semibold tracking-[-.035em] text-[#1a202c]">{t('Drop images here')}</p>
          <p className="relative z-10 mt-2 text-sm text-[#718096]">{t('Browse files or drop a batch. JPG, PNG, WEBP, BMP.')}</p>
        </div>
      )}

      {files.length > 0 && !batchId && (
        <Card>
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div><p className="bankco-eyebrow">{t('Ready to process')}</p><h3 className="font-bankco-display text-lg font-semibold tracking-[-.03em] text-[#1a202c]">{t('{{count}} files selected', { count: files.length })}</h3></div>
              <Button onClick={() => uploadMutation.mutate()} loading={uploadMutation.isPending}>
                {t('Upload All')}
              </Button>
            </div>
            <div className="max-h-64 divide-y divide-[#edf2f7] overflow-y-auto rounded-lg border border-[#edf2f7]">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-[#fafcfa]">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#edf2f7]">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-[#2d3748]">{f.name}</p>
                    <p className="text-xs text-[#718096]">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button aria-label={t('Remove {{name}}', { name: f.name })} title={t('Remove file')} onClick={() => removeFile(i)} className="bankco-icon-button h-8 w-8 border-0 hover:bg-danger-50 hover:text-danger-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {batchId && (
        <Card>
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div><p className="bankco-eyebrow">{t('Batch status')}</p><h3 className="font-bankco-display text-lg font-semibold tracking-[-.03em] text-[#1a202c]">{t('Processing')}</h3></div>

            {progressErr ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 flex-1">{t('Failed to load progress')}</p>
                <Button variant="ghost" size="sm" onClick={() => retryProgress()}><RefreshCw className="w-4 h-4 mr-1" />{t('Retry')}</Button>
              </div>
            ) : (
              <ProgressBar value={progress?.pct ?? 0} showLabel size="md" variant="primary" />
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{t('{{processed}} / {{total}} processed', { processed: progress?.processed ?? 0, total: progress?.total ?? 0 })}</span>
              {batch?.status === 'completed' && <Badge variant="green">{t('Complete')}</Badge>}
              {batch?.status === 'processing' && <Badge variant="yellow">{t('Processing')}</Badge>}
              {batch?.status === 'failed' && <Badge variant="red">{t('Failed')}</Badge>}
              {batch?.status === 'review' && <Badge variant="orange">{t('Ready for Review')}</Badge>}
            </div>

            {batch?.status === 'review' && (
              <Button className="w-full" onClick={() => navigate(`/upload/${batchId}/review`)}>
                {t('Review Mappings')}
              </Button>
            )}

            {(batch?.status === 'completed' || batch?.status === 'failed') && (
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => navigate('/')}>
                  {t('Back to Dashboard')}
                </Button>
                {batch?.status === 'failed' && (
                  <Button className="flex-1" onClick={() => { setBatchId(null); setFiles([]) }}>
                    {t('Try Again')}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
