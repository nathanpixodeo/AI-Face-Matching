import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton'
import { Users, Image, Scan, Search, Upload, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/locale'

function ErrorBox({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#fcDEDE] bg-[#fff7f7] p-4">
      <AlertCircle className="h-5 w-5 shrink-0 text-danger-500" />
      <p className="flex-1 text-sm font-medium text-danger-600">{t('Failed to load data')}</p>
      <Button variant="ghost" size="sm" onClick={onRetry}><RefreshCw className="w-4 h-4 mr-1" />{t('Retry')}</Button>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { locale, t } = useI18n()

  const { data: stats, isLoading: statsLoading, isError: statsErr, refetch: retryStats } = useQuery({
    queryKey: ['stats'],
    queryFn: api.faces.stats,
  })

  const { data: batches, isLoading: batchesLoading, isError: batchesErr, refetch: retryBatches } = useQuery({
    queryKey: ['batches'],
    queryFn: () => api.uploads.batches(5),
  })

  const { data: team, isLoading: teamLoading, isError: teamErr, refetch: retryTeam } = useQuery({
    queryKey: ['team'],
    queryFn: api.team.get,
  })

  const statCards = [
    { icon: Users, label: t('Identities'), value: stats?.totalIdentities ?? 0, color: 'text-primary-600', bg: 'bg-primary-50' },
    { icon: Image, label: t('Images'), value: stats?.totalImages ?? 0, color: 'text-success-600', bg: 'bg-success-50' },
    { icon: Scan, label: t('Faces'), value: stats?.totalFaces ?? 0, color: 'text-accent-500', bg: 'bg-orange-50' },
    { icon: Search, label: t('Matches Today'), value: stats?.matchesToday ?? 0, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-8">
      <div className="bankco-page-header">
        <div>
          <p className="bankco-eyebrow">{t('Operations overview')}</p>
          <h1 className="bankco-page-title">{t('Dashboard')}</h1>
          <p className="bankco-page-description">{t('Monitor image intake, recognition volume, and account capacity.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/upload')}><Upload className="w-4 h-4 mr-2" />{t('Upload')}</Button>
          <Button variant="secondary" onClick={() => navigate('/match')}><Search className="w-4 h-4 mr-2" />{t('Match')}</Button>
        </div>
      </div>

      {statsErr && <ErrorBox onRetry={() => retryStats()} />}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statsLoading ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />) : statCards.map((s, i) => (
          <Card key={i} className="group relative overflow-hidden">
            <CardContent className="relative flex min-h-[132px] flex-col justify-between p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${s.bg} ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="mt-1 h-2 w-2 rounded-full bg-[#edf2f7] transition-colors group-hover:bg-primary-200" />
              </div>
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-[.08em] text-[#718096]">{s.label}</p>
                <p className="mt-1 font-bankco-display text-2xl font-semibold tracking-[-.04em] tabular-nums text-[#1a202c]">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 2xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardContent className="p-0">
            <div className="bankco-panel-header">
              <div>
                <p className="bankco-eyebrow">{t('Queue')}</p>
                <h2 className="font-bankco-display text-lg font-semibold tracking-[-.03em] text-[#1a202c]">{t('Recent batches')}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/upload')}>
                {t('View all')} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="px-5 py-2 sm:px-6">
            {batchesErr ? <div className="py-4"><ErrorBox onRetry={() => retryBatches()} /></div> : batchesLoading ? <div className="py-5"><TableSkeleton /></div> : !batches?.length ? (
              <div className="py-14 text-center text-sm text-[#718096]">{t('No uploads yet. Start by uploading images.')}</div>
            ) : (
              <div className="divide-y divide-[#edf2f7]">
                {batches.map(b => (
                  <div key={b._id} className="flex flex-wrap items-center justify-between gap-3 py-4 transition-colors hover:bg-[#fafcfa]">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-sm font-bold text-[#2d3748]">{new Date(b.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-xs font-medium text-[#718096]">{t('{{count}} images', { count: b.imageCount })}</span>
                      <span className="text-xs font-medium text-[#718096]">{t('{{count}} faces', { count: b.facesDetected })}</span>
                    </div>
                    <Badge variant={b.status === 'completed' ? 'green' : b.status === 'processing' ? 'yellow' : b.status === 'review' ? 'orange' : b.status === 'failed' ? 'red' : 'blue'}>
                      {t(b.status.charAt(0).toUpperCase() + b.status.slice(1))}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 sm:p-6">
            <p className="bankco-eyebrow">{t('Capacity')}</p>
            <h2 className="mb-6 font-bankco-display text-lg font-semibold tracking-[-.03em] text-[#1a202c]">{t('Plan usage')}</h2>
            {teamErr ? <ErrorBox onRetry={() => retryTeam()} /> : teamLoading ? <TableSkeleton rows={4} /> : team ? (
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span className="text-[#718096]">{t('Identities')}</span><span className="font-bold text-[#4a5568]">{team.usage.identities} / {team.limits.identities === Infinity ? '∞' : team.limits.identities}</span></div>
                  <ProgressBar value={team.usage.identities} max={team.limits.identities === Infinity ? 1 : team.limits.identities} variant={team.usage.identities > team.limits.identities * 0.9 ? 'red' : team.usage.identities > team.limits.identities * 0.7 ? 'yellow' : 'primary'} size="sm" />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span className="text-[#718096]">{t('Images')}</span><span className="font-bold text-[#4a5568]">{team.usage.images} / {team.limits.images === Infinity ? '∞' : team.limits.images}</span></div>
                  <ProgressBar value={team.usage.images} max={team.limits.images === Infinity ? 1 : team.limits.images} variant={team.usage.images > team.limits.images * 0.9 ? 'red' : team.usage.images > team.limits.images * 0.7 ? 'yellow' : 'green'} size="sm" />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span className="text-[#718096]">{t('Matches today')}</span><span className="font-bold text-[#4a5568]">{team.usage.matchesToday} / {team.limits.matchesPerDay === Infinity ? '∞' : team.limits.matchesPerDay}</span></div>
                  <ProgressBar value={team.usage.matchesToday} max={team.limits.matchesPerDay === Infinity ? 1 : team.limits.matchesPerDay} variant={team.usage.matchesToday > team.limits.matchesPerDay * 0.9 ? 'red' : 'yellow'} size="sm" />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span className="text-[#718096]">{t('Storage')}</span><span className="font-bold text-[#4a5568]">{(team.usage.storage / 1048576).toFixed(0)}MB / {team.limits.storage === Infinity ? '∞' : `${(team.limits.storage / 1048576).toFixed(0)}MB`}</span></div>
                  <ProgressBar value={team.usage.storage / 1048576} max={team.limits.storage === Infinity ? 1 : team.limits.storage / 1048576} variant={team.usage.storage > team.limits.storage * 0.9 ? 'red' : 'primary'} size="sm" />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
