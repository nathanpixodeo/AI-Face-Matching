import type {
  ApiResponse,
  Stats,
  Identity,
  Face,
  Image,
  UploadBatch,
  MatchResult,
  MatchResponse,
  Workspace,
  Team,
  Member,
  Paginated,
} from '../types'
import { getStoredLocale } from '../i18n/locale'

interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isSuperadmin: boolean
}

interface AuthResult {
  user: AuthUser
  token: string
}

interface BackendTeam {
  id: string
  name: string
  plan: {
    name: string
    limits: {
      maxIdentities: number
      maxImages: number
      maxMatchesPerDay: number
      maxStorageMB: number
      maxTeamMembers: number
      maxFilesPerUpload: number
    }
  } | null
  usage: {
    identitiesCount: number
    imagesCount: number
    matchesToday: number
    storageUsedMB: number
  }
}

interface BackendMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: Member['role']
  createdAt: string
}

interface BackendIdentity {
  id: string
  name: string
  description?: string | null
  avatarFaceId?: string | null
  facesCount: number
  createdAt: string
  updatedAt?: string
}

interface BackendWorkspace {
  id: string
  name: string
  notes?: string | null
  status: boolean
  createdAt: string
  updatedAt?: string
}

interface BackendMatchResult {
  identity: {
    id: string
    name: string
    description?: string | null
  } | null
  similarity: number
}

interface BackendMatchResponse {
  query: MatchResponse['query']
  matches: BackendMatchResult[]
}

const BASE = '/api'

function normalizeTeam(team: BackendTeam): Team {
  const limits = team.plan?.limits
  const planName = team.plan?.name
  const plan: Team['plan'] = planName === 'pro' || planName === 'enterprise' ? planName : 'free'

  return {
    _id: team.id,
    name: team.name,
    plan,
    members: [],
    usage: {
      identities: team.usage.identitiesCount,
      images: team.usage.imagesCount,
      matchesToday: team.usage.matchesToday,
      storage: team.usage.storageUsedMB * 1048576,
    },
    limits: {
      identities: limits?.maxIdentities ?? Infinity,
      images: limits?.maxImages ?? Infinity,
      matchesPerDay: limits?.maxMatchesPerDay ?? Infinity,
      storage: limits ? limits.maxStorageMB * 1048576 : Infinity,
      members: limits?.maxTeamMembers ?? Infinity,
      filesPerUpload: limits?.maxFilesPerUpload ?? Infinity,
    },
  }
}

function normalizeMember(member: BackendMember): Member {
  return {
    _id: member.id,
    user: {
      _id: member.id,
      email: member.email,
      first_name: member.firstName,
      last_name: member.lastName,
      role: member.role,
      isSuperadmin: false,
    },
    role: member.role,
    joinedAt: member.createdAt,
  }
}

function normalizeIdentity(identity: BackendIdentity): Identity {
  return {
    _id: identity.id,
    name: identity.name,
    description: identity.description ?? undefined,
    avatarFaceId: identity.avatarFaceId ?? undefined,
    faceCount: identity.facesCount,
    createdAt: identity.createdAt,
    updatedAt: identity.updatedAt ?? identity.createdAt,
  }
}

function normalizeWorkspace(workspace: BackendWorkspace): Workspace {
  return {
    _id: workspace.id,
    name: workspace.name,
    notes: workspace.notes ?? undefined,
    status: workspace.status ? 'active' : 'inactive',
    createdAt: workspace.createdAt,
  }
}

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  headers['Accept-Language'] = getStoredLocale()
  headers['X-Locale'] = getStoredLocale()
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
      request<AuthResult>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: { first_name: string; last_name: string; email: string; password: string; team_name: string }) =>
      request<AuthResult>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          password: data.password,
          teamName: data.team_name,
        }),
      }),
    forgotPassword: (email: string) =>
      request<{ token: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token: string, password: string) =>
      request<null>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  },
  team: {
    get: async () => normalizeTeam(await request<BackendTeam>('/team')),
    update: async (data: Pick<Team, 'name'>) => {
      await request<unknown>('/team', { method: 'PUT', body: JSON.stringify({ name: data.name }) })
    },
    members: {
      list: async () => (await request<BackendMember[]>('/team/members')).map(normalizeMember),
      add: async (data: { email: string; role: string }) => {
        await request<unknown>('/team/members', { method: 'POST', body: JSON.stringify(data) })
      },
      update: async (id: string, role: string) => {
        await request<unknown>(`/team/members/${id}`, { method: 'PUT', body: JSON.stringify({ role }) })
      },
      remove: (id: string) => request<void>(`/team/members/${id}`, { method: 'DELETE' }),
    },
    plan: async (plan: string) => {
      await request<unknown>('/team/plan', { method: 'PUT', body: JSON.stringify({ planName: plan }) })
    },
  },
  identities: {
    list: async (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.search) q.set('search', params.search)
      const result = await request<Paginated<BackendIdentity>>(`/identities?${q}`)
      return { ...result, items: result.items.map(normalizeIdentity) }
    },
    get: async (id: string) => normalizeIdentity(await request<BackendIdentity>(`/identities/${id}`)),
    create: async (data: { name: string; description?: string }) =>
      normalizeIdentity(await request<BackendIdentity>('/identities', { method: 'POST', body: JSON.stringify(data) })),
    update: async (id: string, data: Pick<Identity, 'name' | 'description'>) => {
      await request<unknown>(`/identities/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    },
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
    submitReview: (id: string, data: Record<string, unknown>) =>
      request<UploadBatch>(`/uploads/batches/${id}/review`, { method: 'PUT', body: JSON.stringify(data) }),
    progress: (id: string) => request<UploadBatch>(`/uploads/batches/${id}/progress`),
    sseUrl: (id: string) => `${BASE}/uploads/batches/${id}/progress`,
  },
  faces: {
    match: async (file: File): Promise<MatchResponse> => {
      const form = new FormData()
      form.append('file', file)
      const result = await request<BackendMatchResponse>('/faces/match', { method: 'POST', body: form })
      return {
        query: result.query,
        matches: result.matches.flatMap((match): MatchResult[] => match.identity ? [{
          identity: {
            _id: match.identity.id,
            name: match.identity.name,
            description: match.identity.description ?? undefined,
          },
          similarity: match.similarity,
        }] : []),
      }
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
    list: async () => (await request<Paginated<BackendWorkspace>>('/workspaces')).items.map(normalizeWorkspace),
    create: async (data: { name: string; notes?: string }) =>
      normalizeWorkspace(await request<BackendWorkspace>('/workspaces', { method: 'POST', body: JSON.stringify(data) })),
    get: async (id: string) => normalizeWorkspace(await request<BackendWorkspace>(`/workspaces/${id}`)),
    update: async (id: string, data: Partial<Workspace>) => {
      const payload = {
        name: data.name,
        notes: data.notes,
        status: data.status === undefined ? undefined : data.status === 'active',
      }
      await request<unknown>(`/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
    },
    delete: (id: string) => request<void>(`/workspaces/${id}`, { method: 'DELETE' }),
  },
}
