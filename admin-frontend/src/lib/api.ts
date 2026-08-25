import type {
  ApiResponse,
  AuthResult,
  Paginated,
  PlatformOverview,
  PlatformTeam,
  PlatformTeamUpdate,
  PlatformUser,
} from '../types'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')
export const adminTokenKey = 'facematch.admin.token'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function readLocale(): string {
  const stored = window.localStorage.getItem('facematch.admin.locale')
  return stored ?? navigator.language ?? 'en'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = window.localStorage.getItem(adminTokenKey)
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  headers.set('X-Locale', readLocale())

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers })
  } catch {
    throw new ApiError('Unable to reach the platform API.', 0)
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null
  if (!response.ok || !payload?.success) {
    if (response.status === 401) window.dispatchEvent(new Event('facematch:admin-unauthorized'))
    throw new ApiError(payload?.message ?? 'The platform API rejected this request.', response.status)
  }

  return payload.data
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  overview: () => request<PlatformOverview>('/platform/overview'),
  teams: (params: URLSearchParams) => request<Paginated<PlatformTeam>>(`/platform/teams?${params}`),
  updateTeam: (teamId: string, data: Partial<Pick<PlatformTeamUpdate, 'status' | 'planName'>>) =>
    request<PlatformTeamUpdate>(`/platform/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  users: (params: URLSearchParams) => request<Paginated<PlatformUser>>(`/platform/users?${params}`),
  updateUserStatus: (userId: string, status: string) =>
    request<PlatformUser>(`/platform/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
}
