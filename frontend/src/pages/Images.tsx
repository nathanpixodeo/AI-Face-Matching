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
import { useI18n } from '../i18n/locale'

export default function Images() {
  const { t } = useI18n()
  const [status, setStatus] = useState<string>('')
  const { page, limit, next, prev, reset } = usePagination()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['images', page, status],
    queryFn: () => api.images.list({ page, limit, status: status || undefined }),
  })

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  return (
    <div className="space-y-8">
      <div className="bankco-page-header">
        <div>
          <p className="bankco-eyebrow">{t('Media library')}</p>
          <h1 className="bankco-page-title">{t('Image library')}</h1>
          <p className="bankco-page-description">{t('Review every uploaded image and its processing status.')}</p>
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); reset() }}
          className="min-h-11 rounded-lg border border-[#edf2f7] bg-white px-4 py-2 text-sm font-bold text-[#4a5568] outline-none transition-colors focus:border-primary-500"
        >
          <option value="">{t('All status')}</option>
          <option value="pending">{t('Pending')}</option>
          <option value="processing">{t('Processing')}</option>
          <option value="completed">{t('Completed')}</option>
          <option value="failed">{t('Failed')}</option>
        </select>
      </div>

      {isError ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#fcDEDE] bg-[#fff7f7] p-4">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-600 flex-1">{t('Failed to load images')}</p>
          <Button variant="ghost" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-1" />{t('Retry')}</Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          icon={<Image className="w-8 h-8" />}
          title={t('No images yet')}
          description={t('Start by uploading images to detect faces.')}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {data.items.map(img => (
              <Link key={img._id} to={`/images/${img._id}`}>
                <Card className="group cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-[0_14px_28px_rgba(42,49,60,.08)]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#edf2f7]">
                    <img src={`/api/images/${img._id}/file`} alt={img.originalName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#1a202c]/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>
                  <CardContent className="space-y-2 p-4">
                    <p className="truncate font-bankco-display text-sm font-semibold tracking-[-.02em] text-[#2d3748]">{img.originalName}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#718096]">{t('{{count}} faces', { count: img.faceCount })}</span>
                      <Badge variant={img.status === 'completed' ? 'green' : img.status === 'processing' ? 'yellow' : img.status === 'failed' ? 'red' : 'gray'}>
                        {t(img.status.charAt(0).toUpperCase() + img.status.slice(1))}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={prev} disabled={page <= 1}
                className="bankco-icon-button disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => {/* page state handled by pagination hook, this is a simplified version */}}
                  className={`h-9 w-9 rounded-lg text-sm font-bold transition-colors ${
                    page === p ? 'bg-primary-500 text-white shadow-[0_6px_12px_rgba(34,197,94,.16)]' : 'text-[#718096] hover:bg-white'
                  }`}>
                  {p}
                </button>
              ))}
              <button onClick={next} disabled={page >= totalPages}
                className="bankco-icon-button disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
