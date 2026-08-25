export type AccountStatus = 'active' | 'suspended'
export type PlanName = 'free' | 'pro' | 'enterprise'

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isSuperadmin: boolean
}

export interface AuthResult {
  token: string
  user: AuthUser
}

export interface PlatformOverview {
  teams: { total: number; active: number; suspended: number }
  users: { total: number; active: number; suspended: number; superadmins: number }
  resources: { identities: number; images: number }
}

export interface PlatformTeam {
  id: string
  name: string
  status: AccountStatus
  planName: PlanName
  memberCount: number
  owner: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  usage: { identitiesCount: number; imagesCount: number; matchesToday: number; storageUsedMB: number }
  createdAt: string
}

export interface PlatformTeamUpdate {
  id: string
  status: AccountStatus
  planName: PlanName
}

export interface PlatformUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isSuperadmin: boolean
  status: AccountStatus
  team: {
    id: string
    name: string
  } | null
  createdAt: string
}

export interface Paginated<T> {
  items: T[]
  page: number
  total: number
  totalPages: number
}
