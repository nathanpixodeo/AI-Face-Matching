import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Search, Camera, AlertCircle, RefreshCw, Upload, SwitchCamera, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import { useI18n } from '../i18n/locale'

export default function FaceMatch() {
  const { toast } = useToast()
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const previewRef = useRef<string | null>(null)
  const cameraRequestRef = useRef(0)

  const matchMutation = useMutation({
    mutationFn: () => api.faces.match(file!),
    onError: (err: Error) => toast('error', err.message || t('Match failed')),
  })

  const stopCamera = useCallback(() => {
    cameraRequestRef.current += 1
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    setCameraStream(null)
    setIsCameraStarting(false)
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => {
    if (!cameraStream || !videoRef.current) return
    const video = videoRef.current
    video.srcObject = cameraStream
    void video.play().catch(() => setCameraError(t('Camera could not be started. Try again or upload a photo instead.')))

    return () => {
      if (video.srcObject === cameraStream) video.srcObject = null
    }
  }, [cameraStream, t])

  useEffect(() => () => {
    stopCamera()
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
  }, [stopCamera])

  const startCamera = useCallback(async (nextFacingMode = facingMode) => {
    stopCamera()
    const requestId = cameraRequestRef.current + 1
    cameraRequestRef.current = requestId
    setCameraError(null)
    setIsCameraStarting(true)

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t('Camera access is not supported in this browser. Upload a photo instead.'))
      setIsCameraStarting(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: nextFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (cameraRequestRef.current !== requestId) {
        stream.getTracks().forEach(track => track.stop())
        return
      }

      streamRef.current = stream
      setCameraStream(stream)
    } catch (error) {
      if (cameraRequestRef.current !== requestId) return
      const name = error instanceof DOMException ? error.name : ''
      const message = name === 'NotAllowedError' || name === 'SecurityError'
        ? t('Camera permission was denied. Allow camera access, then try again.')
        : name === 'NotFoundError'
          ? t('No camera was found. Connect one or upload a photo instead.')
          : name === 'NotReadableError'
            ? t('Camera is busy in another app. Close it, then try again.')
            : t('Camera could not be started. Try again or upload a photo instead.')
      setCameraError(message)
    } finally {
      if (cameraRequestRef.current === requestId) setIsCameraStarting(false)
    }
  }, [facingMode, stopCamera, t])

  function handleFile(f: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      toast('error', t('Unsupported format. Use JPG, PNG, or WEBP'))
      return
    }
    stopCamera()
    setShowCamera(false)
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    const nextPreview = URL.createObjectURL(f)
    previewRef.current = nextPreview
    setFile(f)
    setPreview(nextPreview)
    matchMutation.reset()
  }

  function clearQuery() {
    stopCamera()
    setShowCamera(false)
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = null
    setFile(null)
    setPreview(null)
    matchMutation.reset()
  }

  function openCamera() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = null
    setFile(null)
    setPreview(null)
    matchMutation.reset()
    setShowCamera(true)
    void startCamera()
  }

  function switchCamera() {
    const nextFacingMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextFacingMode)
    void startCamera(nextFacingMode)
  }

  function capturePhoto() {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      toast('error', t('Camera is still starting. Wait a moment, then capture.'))
      return
    }

    const maxDimension = 1600
    const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(blob => {
      if (!blob) {
        toast('error', t('Could not capture this photo. Try again.'))
        return
      }
      handleFile(new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="bankco-page-header">
        <div>
          <p className="bankco-eyebrow">{t('Identity search')}</p>
          <h1 className="bankco-page-title">{t('Face match')}</h1>
          <p className="bankco-page-description">{t('Compare one photo with confirmed identities in this workspace.')}</p>
        </div>
        <div className="hidden items-center gap-2 rounded-lg bg-[#f7fafc] px-4 py-3 text-sm font-bold text-[#4a5568] sm:flex"><Search className="h-4 w-4 text-primary-500" />{t('One query photo at a time')}</div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardContent className="p-0">
            {!preview && !showCamera ? (
              <div className="bankco-dropzone m-5 p-8 text-center sm:m-6 sm:p-12">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
                <div className="relative z-10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white text-primary-600 shadow-[0_10px_24px_rgba(42,49,60,.08)]"><Camera className="h-6 w-6" /></div>
                <p className="relative z-10 font-bankco-display text-xl font-semibold tracking-[-.035em] text-[#1a202c]">{t('Select a query photo')}</p>
                <p className="relative z-10 mt-1 text-sm text-[#718096]">{t('One clear face. JPG, PNG, or WEBP.')}</p>
                <div className="relative z-10 mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
                  <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}><Upload className="h-4 w-4" />{t('Choose photo')}</Button>
                  <Button type="button" onClick={openCamera}><Camera className="h-4 w-4" />{t('Use camera')}</Button>
                </div>
                <p className="relative z-10 mt-5 text-xs leading-5 text-[#718096]">{t('Camera works with your webcam or phone camera. Preview stays on this device until you capture.')}</p>
              </div>
            ) : showCamera ? (
              <div className="space-y-4 p-5 sm:p-6">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#161b26]">
                  <video ref={videoRef} autoPlay muted playsInline aria-label={t('Live camera preview')} className="h-full w-full object-cover" />
                  {!cameraError && <div aria-hidden="true" className="pointer-events-none absolute inset-[12%] rounded-[2rem] border-2 border-white/80 shadow-[0_0_0_999px_rgba(22,27,38,.18)]" />}
                  {isCameraStarting && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#161b26]/85 text-center text-sm font-medium text-white"><span className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white" />{t('Starting camera...')}</div>}
                  {cameraError && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-sm text-white"><AlertCircle className="h-8 w-8 text-[#ffb4a5]" /><p aria-live="polite">{cameraError}</p><Button type="button" variant="secondary" onClick={() => void startCamera()}>{t('Try camera again')}</Button></div>}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-bold text-[#2d3748]">{t('Live camera')}</p><p className="mt-1 text-xs leading-5 text-[#718096]">{t('Center one face in the frame, then capture a photo.')}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={switchCamera} disabled={isCameraStarting || Boolean(cameraError)}><SwitchCamera className="h-4 w-4" />{t('Switch camera')}</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={clearQuery}><X className="h-4 w-4" />{t('Cancel')}</Button>
                    <Button type="button" size="sm" onClick={capturePhoto} disabled={isCameraStarting || Boolean(cameraError) || !cameraStream}><Camera className="h-4 w-4" />{t('Capture photo')}</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-5 sm:p-6">
                <div className="rounded-lg bg-[#1a202c] p-3"><img src={preview ?? ''} alt={t('Query')} className="max-h-80 w-full rounded-md object-contain" /></div>

                <div className="flex gap-3">
                  <Button onClick={() => matchMutation.mutate()} loading={matchMutation.isPending} className="flex-1">
                    <Search className="w-4 h-4 mr-2" />{t('Find Matches')}
                  </Button>
                  <Button variant="secondary" onClick={clearQuery}>
                    {t('Reset')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="bankco-panel-header rounded-xl border border-[#edf2f7] bg-white"><div><p className="bankco-eyebrow">{t('Candidates')}</p><h2 className="font-bankco-display text-lg font-semibold tracking-[-.03em] text-[#1a202c]">{t('Results')}</h2></div>{matchMutation.isSuccess && <span className="text-xs font-bold text-[#718096]">{t('Ranked by similarity')}</span>}</div>

          {matchMutation.isPending && (
            <div className="bankco-panel flex flex-col items-center justify-center py-16 text-[#718096]">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#edf2f7] border-t-primary-500" />
              <p className="text-sm font-medium">{t('Searching for matches...')}</p>
            </div>
          )}

          {matchMutation.isError && (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 flex-1">{matchMutation.error.message}</p>
                  <Button variant="ghost" size="sm" onClick={() => matchMutation.mutate()}><RefreshCw className="w-4 h-4 mr-1" />{t('Retry')}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {matchMutation.data?.matches.length ? (
            <div className="space-y-3">
              {matchMutation.data.matches.map((r, i) => (
                <Link key={i} to={`/identities/${r.identity._id}`}>
                  <Card className="cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-[0_12px_25px_rgba(42,49,60,.07)]">
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar name={r.identity.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#2d3748]">{r.identity.name}</p>
                        {r.identity.description && <p className="truncate text-xs text-[#718096]">{r.identity.description}</p>}
                      </div>
                      <div className={`rounded-lg px-3 py-2 text-right font-bankco-display text-lg font-semibold tabular-nums ${
                        r.similarity >= 80 ? 'bg-[#d9fbe6] text-success-600' :
                        r.similarity >= 60 ? 'bg-[#fffbea] text-[#a16207]' :
                        'bg-[#fff0eb] text-accent-500'
                      }`}>
                        {Math.round(r.similarity)}%
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : matchMutation.isSuccess && (
            <div className="bankco-panel p-12 text-center text-sm text-[#718096]">
                <Camera className="mx-auto mb-3 h-10 w-10 text-[#cbd5e0]" />
                <p>{t('No matching identities found.')}</p>
                <p className="text-xs mt-1">{t('The person may not be registered yet.')}</p>
            </div>
          )}

          {!matchMutation.isPending && !matchMutation.isSuccess && !matchMutation.isError && (
            <div className="bankco-panel p-12 text-center text-sm text-[#718096]">
                <Search className="mx-auto mb-3 h-10 w-10 text-[#cbd5e0]" />
                <p>{t('Upload a photo and click "Find Matches"')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
