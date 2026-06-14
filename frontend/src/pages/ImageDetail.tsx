import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { CardSkeleton } from '../components/ui/Skeleton'
import { ArrowLeft, Trash2 } from 'lucide-react'

export default function ImageDetail() {
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

  if (isLoading) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>
  if (!image) return null

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/images')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Images
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="bg-black relative">
              <img src={`/api/images/${image._id}/file`} alt={image.originalName} className="w-full max-h-[70vh] object-contain mx-auto" />
              {image.faces?.map((face, i) => (
                <div
                  key={i}
                  className="absolute border-2 border-primary-500 bg-primary-500/20 cursor-pointer hover:bg-primary-500/30 transition-colors"
                  style={{
                    left: `${face.bbox.x}%`,
                    top: `${face.bbox.y}%`,
                    width: `${face.bbox.width}%`,
                    height: `${face.bbox.height}%`,
                  }}
                  title={`${face.identity?.name || 'Unmatched'} (${Math.round(face.confidence * 100)}%)`}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold text-lg">Image Info</h2>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Filename:</span> <span className="text-gray-900">{image.originalName}</span></div>
                <div><span className="text-gray-500">Size:</span> <span className="text-gray-900">{(image.size / 1024 / 1024).toFixed(2)} MB</span></div>
                <div><span className="text-gray-500">Dimensions:</span> <span className="text-gray-900">{image.width}×{image.height}</span></div>
                <div><span className="text-gray-500">Uploaded:</span> <span className="text-gray-900">{new Date(image.createdAt).toLocaleDateString()}</span></div>
                <div><span className="text-gray-500">Status:</span> <Badge variant={image.status === 'completed' ? 'green' : image.status === 'processing' ? 'yellow' : 'red'}>{image.status}</Badge></div>
                <div><span className="text-gray-500">Faces:</span> <span className="text-gray-900">{image.faceCount}</span></div>
              </div>
              <Button variant="danger" className="w-full" onClick={() => remove.mutate()} loading={remove.isPending}>
                <Trash2 className="w-4 h-4 mr-2" />Delete Image
              </Button>
            </CardContent>
          </Card>

          {image.faces?.length ? (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="font-semibold">Detected Faces</h2>
                {image.faces.map((face, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {face.image && <img src={`/api/images/${face.image._id}/file`} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{face.identity?.name || 'Unmatched'}</p>
                      <p className="text-xs text-gray-500">{Math.round(face.age)}y · {face.gender}</p>
                    </div>
                    <Badge variant={face.status === 'confirmed' ? 'green' : face.status === 'matched' ? 'blue' : 'orange'}>
                      {face.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
