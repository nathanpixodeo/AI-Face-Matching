import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Search, Camera, AlertCircle, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'

export default function FaceMatch() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const matchMutation = useMutation({
    mutationFn: () => api.faces.match(file!),
    onError: (err: Error) => toast('error', err.message || 'Match failed'),
  })

  function handleFile(f: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      toast('error', 'Unsupported format. Use JPG, PNG, or WEBP')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    matchMutation.reset()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Face Match</h1>
        <p className="text-sm text-gray-500 mt-1">Upload a photo to find matching identities</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            {!preview ? (
              <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50/50 transition-all"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900">Upload a photo</p>
                <p className="text-sm text-gray-500 mt-1">Single image with a clear face</p>
              </div>
            ) : (
              <div className="space-y-4">
                <img src={preview} alt="Query" className="w-full rounded-xl max-h-80 object-contain bg-gray-100" />

                <div className="flex gap-3">
                  <Button onClick={() => matchMutation.mutate()} loading={matchMutation.isPending} className="flex-1">
                    <Search className="w-4 h-4 mr-2" />Find Matches
                  </Button>
                  <Button variant="secondary" onClick={() => { setFile(null); setPreview(null); matchMutation.reset() }}>
                    Reset
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Results</h2>

          {matchMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-primary-600 mb-4" />
              <p className="text-sm">Searching for matches...</p>
            </div>
          )}

          {matchMutation.isError && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 flex-1">{matchMutation.error.message}</p>
                  <Button variant="ghost" size="sm" onClick={() => matchMutation.mutate()}><RefreshCw className="w-4 h-4 mr-1" />Retry</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {matchMutation.data?.length ? (
            <div className="space-y-3">
              {matchMutation.data.map((r, i) => (
                <Link key={i} to={`/identities/${r.identity._id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar name={r.identity.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{r.identity.name}</p>
                        {r.identity.description && <p className="text-xs text-gray-500 truncate">{r.identity.description}</p>}
                      </div>
                      <div className={`text-lg font-bold px-3 py-1.5 rounded-lg ${
                        r.similarity >= 80 ? 'bg-success-50 text-success-600' :
                        r.similarity >= 60 ? 'bg-yellow-50 text-yellow-700' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {Math.round(r.similarity)}%
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : matchMutation.isSuccess && (
            <Card>
              <CardContent className="p-12 text-center text-sm text-gray-500">
                <Camera className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p>No matching identities found.</p>
                <p className="text-xs mt-1">The person may not be registered yet.</p>
              </CardContent>
            </Card>
          )}

          {!matchMutation.isPending && !matchMutation.isSuccess && !matchMutation.isError && (
            <Card>
              <CardContent className="p-12 text-center text-sm text-gray-400">
                <Search className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                <p>Upload a photo and click "Find Matches"</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
