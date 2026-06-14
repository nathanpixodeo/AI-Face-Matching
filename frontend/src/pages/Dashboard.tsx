import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton'
import { Users, Image, Scan, Search, Upload, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
      <p className="text-sm text-red-600 flex-1">Failed to load data</p>
      <Button variant="ghost" size="sm" onClick={onRetry}><RefreshCw className="w-4 h-4 mr-1" />Retry</Button>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

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
    { icon: Users, label: 'Identities', value: stats?.totalIdentities ?? 0, color: 'text-primary-600', bg: 'bg-primary-50' },
    { icon: Image, label: 'Images', value: stats?.totalImages ?? 0, color: 'text-success-600', bg: 'bg-success-50' },
    { icon: Scan, label: 'Faces', value: stats?.totalFaces ?? 0, color: 'text-accent-500', bg: 'bg-orange-50' },
    { icon: Search, label: 'Matches Today', value: stats?.matchesToday ?? 0, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your face recognition system</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/upload')}><Upload className="w-4 h-4 mr-2" />Upload</Button>
          <Button variant="secondary" onClick={() => navigate('/match')}><Search className="w-4 h-4 mr-2" />Match</Button>
        </div>
      </div>

      {statsErr && <ErrorBox onRetry={() => retryStats()} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />) : statCards.map((s, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Batches</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/upload')}>
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {batchesErr ? <ErrorBox onRetry={() => retryBatches()} /> : batchesLoading ? <TableSkeleton /> : !batches?.length ? (
              <div className="text-center py-12 text-sm text-gray-500">No uploads yet. Start by uploading images.</div>
            ) : (
              <div className="space-y-2">
                {batches.map(b => (
                  <div key={b._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-sm text-gray-500">{b.imageCount} images</span>
                      <span className="text-sm text-gray-500">{b.facesDetected} faces</span>
                    </div>
                    <Badge variant={b.status === 'completed' ? 'green' : b.status === 'processing' ? 'yellow' : b.status === 'review' ? 'orange' : b.status === 'failed' ? 'red' : 'blue'}>
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Plan Usage</h2>
            {teamErr ? <ErrorBox onRetry={() => retryTeam()} /> : teamLoading ? <TableSkeleton rows={4} /> : team ? (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Identities</span><span className="font-medium text-gray-700">{team.usage.identities} / {team.limits.identities === Infinity ? '∞' : team.limits.identities}</span></div>
                  <ProgressBar value={team.usage.identities} max={team.limits.identities === Infinity ? 1 : team.limits.identities} variant={team.usage.identities > team.limits.identities * 0.9 ? 'red' : team.usage.identities > team.limits.identities * 0.7 ? 'yellow' : 'primary'} size="sm" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Images</span><span className="font-medium text-gray-700">{team.usage.images} / {team.limits.images === Infinity ? '∞' : team.limits.images}</span></div>
                  <ProgressBar value={team.usage.images} max={team.limits.images === Infinity ? 1 : team.limits.images} variant={team.usage.images > team.limits.images * 0.9 ? 'red' : team.usage.images > team.limits.images * 0.7 ? 'yellow' : 'green'} size="sm" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Matches today</span><span className="font-medium text-gray-700">{team.usage.matchesToday} / {team.limits.matchesPerDay === Infinity ? '∞' : team.limits.matchesPerDay}</span></div>
                  <ProgressBar value={team.usage.matchesToday} max={team.limits.matchesPerDay === Infinity ? 1 : team.limits.matchesPerDay} variant={team.usage.matchesToday > team.limits.matchesPerDay * 0.9 ? 'red' : 'yellow'} size="sm" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Storage</span><span className="font-medium text-gray-700">{(team.usage.storage / 1048576).toFixed(0)}MB / {team.limits.storage === Infinity ? '∞' : `${(team.limits.storage / 1048576).toFixed(0)}MB`}</span></div>
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
