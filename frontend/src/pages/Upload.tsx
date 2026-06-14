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

export default function UploadPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
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
      toast('success', `${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully`)
    },
    onError: (err: Error) => {
      toast('error', err.message || 'Upload failed')
    },
  })

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'].includes(f.type))
    if (!dropped.length) { toast('error', 'Unsupported file type. Accepted: JPG, PNG, WEBP, BMP'); return }
    setFiles(prev => [...prev, ...dropped])
  }, [toast])

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index))

  const progress = batch ? {
    total: batch.imageCount,
    processed: batch.facesDetected + batch.facesUnmatched + batch.facesMapped,
    pct: batch.imageCount ? Math.round(((batch.facesDetected + batch.facesUnmatched + batch.facesMapped) / batch.imageCount) * 100) : 0,
  } : null

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Images</h1>
        <p className="text-sm text-gray-500 mt-1">Drag and drop images to detect and map faces</p>
      </div>

      {!batchId && (
        <Card>
          <CardContent className="p-8">
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={clsx(
                'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all',
                dragging ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
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
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900">Drop images here</p>
              <p className="text-sm text-gray-500 mt-1">or click to browse · JPG, PNG, WEBP, BMP</p>
            </div>
          </CardContent>
        </Card>
      )}

      {files.length > 0 && !batchId && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{files.length} file{files.length > 1 ? 's' : ''} selected</h3>
              <Button onClick={() => uploadMutation.mutate()} loading={uploadMutation.isPending}>
                Upload All
              </Button>
            </div>
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                    <p className="text-xs text-gray-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={() => removeFile(i)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
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
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">Processing</h3>

            {progressErr ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 flex-1">Failed to load progress</p>
                <Button variant="ghost" size="sm" onClick={() => retryProgress()}><RefreshCw className="w-4 h-4 mr-1" />Retry</Button>
              </div>
            ) : (
              <ProgressBar value={progress?.pct ?? 0} showLabel size="md" variant="primary" />
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{progress?.processed ?? 0} / {progress?.total ?? 0} processed</span>
              {batch?.status === 'completed' && <Badge variant="green">Complete</Badge>}
              {batch?.status === 'processing' && <Badge variant="yellow">Processing</Badge>}
              {batch?.status === 'failed' && <Badge variant="red">Failed</Badge>}
              {batch?.status === 'review' && <Badge variant="orange">Ready for Review</Badge>}
            </div>

            {batch?.status === 'review' && (
              <Button className="w-full" onClick={() => navigate(`/upload/${batchId}/review`)}>
                Review Mappings
              </Button>
            )}

            {(batch?.status === 'completed' || batch?.status === 'failed') && (
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => navigate('/')}>
                  Back to Dashboard
                </Button>
                {batch?.status === 'failed' && (
                  <Button className="flex-1" onClick={() => { setBatchId(null); setFiles([]) }}>
                    Try Again
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
