import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Search, Camera, AlertCircle, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import { useI18n } from '../i18n/locale'

export default function FaceMatch() {
  const { toast } = useToast()
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const matchMutation = useMutation({
    mutationFn: () => api.faces.match(file!),
    onError: (err: Error) => toast('error', err.message || t('Match failed')),
  })

  function handleFile(f: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      toast('error', t('Unsupported format. Use JPG, PNG, or WEBP'))
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    matchMutation.reset()
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
            {!preview ? (
              <div
                onClick={() => inputRef.current?.click()}
                className="bankco-dropzone m-5 cursor-pointer p-12 text-center transition-colors hover:border-primary-400 sm:m-6"
              >
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
              </div>
            ) : (
              <div className="space-y-4 p-5 sm:p-6">
                <div className="rounded-lg bg-[#1a202c] p-3"><img src={preview} alt={t('Query')} className="max-h-80 w-full rounded-md object-contain" /></div>

                <div className="flex gap-3">
                  <Button onClick={() => matchMutation.mutate()} loading={matchMutation.isPending} className="flex-1">
                    <Search className="w-4 h-4 mr-2" />{t('Find Matches')}
                  </Button>
                  <Button variant="secondary" onClick={() => { setFile(null); setPreview(null); matchMutation.reset() }}>
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

          {matchMutation.data?.length ? (
            <div className="space-y-3">
              {matchMutation.data.map((r, i) => (
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
