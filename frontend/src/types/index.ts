export interface User {
  _id: string
  email: string
  first_name: string
  last_name: string
  role: string
  isSuperadmin: boolean
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
}

export interface Team {
  _id: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  members: Member[]
  usage: {
    identities: number
    images: number
    matchesToday: number
    storage: number
  }
  limits: {
    identities: number
    images: number
    matchesPerDay: number
    storage: number
    members: number
    filesPerUpload: number
  }
}

export interface Member {
  _id: string
  user: User
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
}

export interface Identity {
  _id: string
  name: string
  description?: string
  avatarFaceId?: string
  faceCount: number
  createdAt: string
  updatedAt: string
}

export interface Face {
  _id: string
  image: Image
  identity?: Identity
  bbox: { x: number; y: number; width: number; height: number }
  age: number
  gender: string
  genderProbability: number
  confidence: number
  descriptor: number[]
  status: 'unmatched' | 'matched' | 'confirmed' | 'skipped'
  batch?: string
  createdAt: string
}

export interface Image {
  _id: string
  originalName: string
  filename: string
  mimetype: string
  size: number
  width: number
  height: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  faceCount: number
  faces: Face[]
  batch?: string
  createdAt: string
}

export interface UploadBatch {
  _id: string
  status: 'uploading' | 'processing' | 'review' | 'completed' | 'failed'
  imageCount: number
  facesDetected: number
  facesMapped: number
  facesUnmatched: number
  images: Image[]
  progress: BatchProgress
  createdAt: string
}

export interface BatchProgress {
  total: number
  processed: number
  failed: number
  status: string
}

export interface MatchResult {
  identity: Identity
  similarity: number
  face?: Face
}

export interface Workspace {
  _id: string
  name: string
  notes?: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface Stats {
  totalIdentities: number
  totalImages: number
  totalFaces: number
  matchesToday: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}
