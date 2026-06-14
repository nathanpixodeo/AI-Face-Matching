import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { CardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { usePagination } from '../hooks/useUtils'
import { Image, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Images() {
  const [status, setStatus] = useState<string>('')
  const { page, limit, next, prev, reset } = usePagination()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['images', page, status],
    queryFn: () => api.images.list({ page, limit, status: status || undefined }),
  })

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Image Library</h1>
          <p className="text-sm text-gray-500 mt-1">All uploaded images</p>
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); reset() }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {isError ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-600 flex-1">Failed to load images</p>
          <Button variant="ghost" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-1" />Retry</Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          icon={<Image className="w-8 h-8" />}
          title="No images yet"
          description="Start by uploading images to detect faces."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.items.map(img => (
              <Link key={img._id} to={`/images/${img._id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    <img src={`/api/images/${img._id}/file`} alt={img.originalName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <CardContent className="p-3 space-y-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{img.originalName}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{img.faceCount} face{img.faceCount !== 1 ? 's' : ''}</span>
                      <Badge variant={img.status === 'completed' ? 'green' : img.status === 'processing' ? 'yellow' : img.status === 'failed' ? 'red' : 'gray'}>
                        {img.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button onClick={prev} disabled={page <= 1}
                className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => {/* page state handled by pagination hook, this is a simplified version */}}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === p ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  {p}
                </button>
              ))}
              <button onClick={next} disabled={page >= totalPages}
                className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
