# AI Face Matching — Frontend

Production-grade React SPA for face recognition management. Built with **React 19**, **TypeScript 6**, **Vite 8**, **Tailwind CSS 4**, and **TanStack Query 5**.

## Quick Start

```bash
# Ensure the backend API is running on :4001
npm install
npm run dev          # → http://localhost:5173
npm run build        # → dist/
```

> The Vite dev server proxies `/api/*` requests to `http://localhost:4001` (configured in `vite.config.ts`).

## Tech Stack

| Layer | Library | Version |
|-------|---------|---------|
| Framework | React | 19.2.6 |
| Language | TypeScript | 6.0 |
| Build tool | Vite | 8.0 |
| Styling | Tailwind CSS | 4.3 |
| Routing | React Router | 7.17 |
| Server state | TanStack Query | 5.101 |
| Icons | Lucide React | latest |
| HTTP | Fetch (native) | — |

## Project Structure

```
src/
├── main.tsx                      # Entry point
├── App.tsx                       # Router + providers
├── index.css                     # Tailwind imports + theme tokens
│
├── types/index.ts                # All TypeScript interfaces
├── lib/api.ts                    # API client (all endpoints)
│
├── contexts/
│   ├── AuthContext.tsx            # JWT auth state + login/register/logout
│   └── ToastContext.tsx           # Toast notification system
│
├── hooks/
│   └── useUtils.ts               # useSSE, useDebounce, usePagination
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx          # Sidebar + TopBar + Outlet
│   │   ├── AuthLayout.tsx         # Centered card layout
│   │   └── TopBar.tsx             # User menu + logout dropdown
│   └── ui/
│       ├── Avatar.tsx             # Initials or image fallback
│       ├── Badge.tsx              # Status badges (6 variants)
│       ├── Button.tsx             # 4 variants, 3 sizes, loading state
│       ├── Card.tsx               # Card + CardHeader + CardContent
│       ├── EmptyState.tsx         # Illustration + text + CTA
│       ├── Input.tsx              # Input with label/error/icon + Select
│       ├── Modal.tsx              # Overlay + ESC close + 3 sizes
│       ├── ProgressBar.tsx        # Colored bars with label support
│       └── Skeleton.tsx           # CardSkeleton, TableSkeleton
│
└── pages/
    ├── Login.tsx                  # Email + password, show/hide toggle
    ├── Register.tsx               # Password strength bar
    ├── Dashboard.tsx              # Stats, batches, plan usage
    ├── Identities.tsx             # Grid/list, search, create modal
    ├── IdentityDetail.tsx         # Profile edit, face gallery, delete
    ├── Upload.tsx                 # Drag-drop, preview, SSE progress
    ├── UploadReview.tsx           # Face grid, assign/skip
    ├── FaceMatch.tsx              # Single upload, ranked results
    ├── Images.tsx                 # Image grid, status filter
    ├── ImageDetail.tsx            # Viewer, bbox overlays, face list
    ├── Workspaces.tsx             # CRUD table, status toggle
    └── Settings.tsx               # Tabs: General/Members/Plan
```

## Pages & Routes

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/login` | Login | No | Email + password authentication |
| `/register` | Register | No | Account + team creation |
| `/` | Dashboard | Yes | Stats, recent batches, plan usage |
| `/identities` | Identities | Yes | Known people profiles (grid/list) |
| `/identities/:id` | Identity Detail | Yes | Profile + linked faces gallery |
| `/upload` | Upload | Yes | Drag & drop + SSE progress |
| `/upload/:batchId/review` | Upload Review | Yes | Face mapping review |
| `/match` | Face Match | Yes | Photo search with ranking |
| `/images` | Images | Yes | Image library with filters |
| `/images/:id` | Image Detail | Yes | Viewer + bbox overlays |
| `/workspaces` | Workspaces | Yes | Workspace management |
| `/settings` | Settings | Yes | Team settings + members + plan |

## Data Flow

```
┌─────────┐   JWT Bearer    ┌──────────────┐
│  Client  │ ──────────────> │  Fastify API │
│ :5173    │ <────────────── │ :4001        │
└─────────┘   JSON Response └──────────────┘
     │                            │
     ├── AuthContext (token)      ├── Auth (/api/auth/*)
     ├── TanStack Query (cache)   ├── Identities (/api/identities/*)
     ├── Toast Notifications      ├── Uploads (/api/uploads/*)
     └── SSE for live progress    ├── Faces (/api/faces/*)
                                  ├── Images (/api/images/*)
                                  └── Workspaces (/api/workspaces/*)
```

## Component States

Every data-driven component implements 4 states:

| State | Visual | Implementation |
|-------|--------|----------------|
| **Loading** | Skeleton shimmer | `CardSkeleton`, `TableSkeleton` |
| **Empty** | Illustration + text + CTA | `EmptyState` component |
| **Error** | Red alert + retry button | Inline `ErrorBox` with `RefreshCw` |
| **Success** | Normal content | TanStack Query `data` |

## API Client

All endpoints are typed via `src/lib/api.ts`. Usage:

```ts
import { api } from '../lib/api'

// GET with query params
const { data } = useQuery({
  queryKey: ['identities', page, search],
  queryFn: () => api.identities.list({ page, limit: 20, search }),
})

// POST with JSON body
const mutation = useMutation({
  mutationFn: () => api.identities.create({ name, description }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['identities'] }),
  onError: (err) => toast('error', err.message),
})

// Upload files (multipart)
api.uploads.upload(files)

// SSE for live progress
const { data, connected } = useSSE('/api/uploads/batches/:id/progress')
```

## Environment

The frontend requires no `.env` file — API proxy is hardcoded in `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4001',
      changeOrigin: true,
    },
  },
}
```

For production, build static files and serve behind nginx:

```nginx
location /api/ {
    proxy_pass http://localhost:4001;
}
location / {
    root /var/www/frontend/dist;
    try_files $uri $uri/ /index.html;
}
```

## Scripts

```bash
npm run dev        # Start dev server (Vite)
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint check
```

## Production Build

```
dist/
├── index.html                   # 0.7 KB
├── assets/
│   ├── index-*.css              # 31 KB (gzip: 6 KB)
│   └── index-*.js               # 346 KB (gzip: 95 KB)
```

Total: **~396 KB** uncompressed, **~101 KB** gzipped.
