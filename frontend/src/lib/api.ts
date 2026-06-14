import type { ApiResponse, Stats, Identity, Face, Image, UploadBatch, MatchResult, Workspace, Team } from '../types'

const BASE = '/api'

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (opts?.body && typeof opts.body === 'string') headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${url}`, { ...opts, headers })
  const json: ApiResponse<T> = await res.json()
  if (!json.success) throw new Error(json.message || 'Request failed')
  return json.data
}

export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: { first_name: string; last_name: string; email: string; password: string; team_name: string }) =>
      request<{ user: any; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  },
  team: {
    get: () => request<Team>('/team'),
    update: (data: Partial<Team>) => request<Team>('/team', { method: 'PUT', body: JSON.stringify(data) }),
    members: {
      list: () => request<any[]>('/team/members'),
      add: (data: { email: string; role: string }) => request<any>('/team/members', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, role: string) => request<any>(`/team/members/${id}`, { method: 'PUT', body: JSON.stringify({ role }) }),
      remove: (id: string) => request<any>(`/team/members/${id}`, { method: 'DELETE' }),
    },
    plan: (plan: string) => request<Team>('/team/plan', { method: 'PUT', body: JSON.stringify({ plan }) }),
  },
  identities: {
    list: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.search) q.set('search', params.search)
      return request<{ items: Identity[]; total: number }>(`/identities?${q}`)
    },
    get: (id: string) => request<Identity>(`/identities/${id}`),
    create: (data: { name: string; description?: string }) =>
      request<Identity>('/identities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Identity>) =>
      request<Identity>(`/identities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/identities/${id}`, { method: 'DELETE' }),
    faces: (id: string) => request<Face[]>(`/identities/${id}/faces`),
  },
  uploads: {
    upload: (files: File[]) => {
      const form = new FormData()
      files.forEach(f => form.append('files', f))
      return request<UploadBatch>('/uploads', { method: 'POST', body: form })
    },
    batches: (limit?: number) => {
      const q = limit ? `?limit=${limit}` : ''
      return request<UploadBatch[]>(`/uploads/batches${q}`)
    },
    batch: (id: string) => request<UploadBatch>(`/uploads/batches/${id}`),
    review: (id: string) => request<UploadBatch>(`/uploads/batches/${id}/review`),
    submitReview: (id: string, data: any) =>
      request<UploadBatch>(`/uploads/batches/${id}/review`, { method: 'PUT', body: JSON.stringify(data) }),
    progress: (id: string) => request<UploadBatch>(`/uploads/batches/${id}/progress`),
    sseUrl: (id: string) => `${BASE}/uploads/batches/${id}/progress`,
  },
  faces: {
    match: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return request<MatchResult[]>('/faces/match', { method: 'POST', body: form })
    },
    list: () => request<Face[]>('/faces'),
    get: (id: string) => request<Face>(`/faces/${id}`),
    stats: () => request<Stats>('/faces/stats'),
  },
  images: {
    list: (params?: { page?: number; limit?: number; status?: string }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.status) q.set('status', params.status)
      return request<{ items: Image[]; total: number }>(`/images?${q}`)
    },
    get: (id: string) => request<Image>(`/images/${id}`),
    delete: (id: string) => request<void>(`/images/${id}`, { method: 'DELETE' }),
  },
  workspaces: {
    list: () => request<Workspace[]>('/workspaces'),
    create: (data: { name: string; notes?: string }) =>
      request<Workspace>('/workspaces', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => request<Workspace>(`/workspaces/${id}`),
    update: (id: string, data: Partial<Workspace>) =>
      request<Workspace>(`/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/workspaces/${id}`, { method: 'DELETE' }),
  },
}
