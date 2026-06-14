# AI Face Matching — Frontend

Production-grade React SPA for face recognition management. **14 pages**, route-level code splitting, JWT auth, SSE live progress, drag-drop upload, face review, and Playwright E2E tests.

Built with **React 19**, **TypeScript 6**, **Vite 8**, **Tailwind CSS 4**, and **TanStack Query 5**.

## Quick Start

```bash
# Ensure the backend API is running on :4001
npm install
npm run dev            # → http://localhost:5173
npm run build          # → dist/
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
| E2E Testing | Playwright | latest |

## Project Structure

```
src/
├── main.tsx                      # Entry point
├── App.tsx                       # Router + providers + lazy routes
├── index.css                     # Tailwind imports + theme tokens
│
├── types/index.ts                # All TypeScript interfaces
├── lib/api.ts                    # Typed API client (all endpoints)
│
├── contexts/
│   ├── AuthContext.tsx            # JWT auth state + login/register/logout
│   └── ToastContext.tsx           # Toast notification system (bottom-right)
│
├── hooks/
│   └── useUtils.ts               # useSSE, useDebounce, usePagination
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx          # Sidebar + TopBar + <Outlet />
│   │   ├── AuthLayout.tsx         # Centered card layout (public routes)
│   │   └── TopBar.tsx             # User menu dropdown + logout
│   └── ui/
│       ├── Avatar.tsx             # Initials or image fallback
│       ├── Badge.tsx              # 6 status variants (green/red/yellow/blue/orange/purple)
│       ├── Button.tsx             # 4 variants, 3 sizes, loading spinner
│       ├── Card.tsx               # Card + CardHeader + CardContent
│       ├── EmptyState.tsx         # Illustration + text + CTA button
│       ├── Input.tsx              # Text input + label + error + icon + Select
│       ├── Modal.tsx              # Overlay + ESC close + 3 sizes
│       ├── ProgressBar.tsx        # Colored bars (primary/green/yellow/red)
│       └── Skeleton.tsx           # CardSkeleton, TableSkeleton shimmer
│
├── pages/                        # 14 pages (lazy-loaded via React.lazy)
│   ├── Login.tsx                  # Email + password + show/hide toggle
│   ├── Register.tsx               # + password strength bar + team name
│   ├── ForgotPassword.tsx         # Email → success confirmation
│   ├── ResetPassword.tsx          # Token param → new password → redirect
│   ├── Dashboard.tsx              # 4 stat cards + recent batches + plan usage
│   ├── Identities.tsx             # Grid/list toggle + search + create modal
│   ├── IdentityDetail.tsx         # Profile edit + face gallery + delete
│   ├── Upload.tsx                 # Drag-drop zone + file preview + SSE progress
│   ├── UploadReview.tsx           # Face grid + assign/skip/confirm/create
│   ├── FaceMatch.tsx              # Single upload + ranked results (identity cards)
│   ├── Images.tsx                 # Grid + status filter (all/pending/completed/failed)
│   ├── ImageDetail.tsx            # Viewer + bbox overlays + face list
│   ├── Workspaces.tsx             # CRUD table + modal + status toggle
│   └── Settings.tsx               # 3 tabs: General / Members / Plan
│
└── e2e/                          # Playwright E2E tests
    ├── auth.spec.ts              # 8 tests: register, login, invalid, forgot-pw, navigation, logout, protected
    └── upload.spec.ts            # 4 tests: upload page, drop zone, identities nav, match nav
```

## Pages & Routes

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/login` | Login | No | Email + password authentication |
| `/register` | Register | No | Account + team creation with password strength |
| `/forgot-password` | Forgot Password | No | Enter email → reset link confirmation |
| `/reset-password/:token` | Reset Password | No | New password with token from email |
| `/` | Dashboard | Yes | Stats, recent batches, plan usage bars |
| `/identities` | Identities | Yes | Known people profiles (grid/list) |
| `/identities/:id` | Identity Detail | Yes | Profile + linked faces gallery |
| `/upload` | Upload | Yes | Drag & drop + SSE progress bar |
| `/upload/:batchId/review` | Upload Review | Yes | Auto-mapped face grid + assign controls |
| `/match` | Face Match | Yes | Photo search with ranked identity results |
| `/images` | Images | Yes | Image library with status filters |
| `/images/:id` | Image Detail | Yes | Viewer + bbox overlays + face list |
| `/workspaces` | Workspaces | Yes | Workspace CRUD with status toggle |
| `/settings` | Settings | Yes | Team name, members table, plan usage |

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

Every data-driven component implements these states:

| State | Visual | Implementation |
|-------|--------|----------------|
| **Loading** | Skeleton shimmer | `CardSkeleton`, `TableSkeleton` |
| **Empty** | Illustration + text + CTA | `EmptyState` component |
| **Error** | Red alert + retry button | Inline `ErrorBox` with `RefreshCw` icon |
| **Success** | Normal content | TanStack Query `data` |

## Auth Flow

```
Login/Register → API returns { user, token }
               → AuthContext stores token in localStorage
               → JWT decoded → user state set
               → Protected routes check token
               → Expired tokens → auto-logout
               → Logout → clear localStorage → redirect /login
```

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

// Password reset
await api.auth.forgotPassword(email)      // → { token }
await api.auth.resetPassword(token, pw)   // → null
```

## Code Splitting

All 14 pages use `React.lazy()` + `<Suspense>` for route-level code splitting:

```tsx
const Dashboard = lazy(() => import('./pages/Dashboard'))

// Each page loads only when navigated to
<Route path="/" element={<Lazy><Dashboard /></Lazy>} />
```

The `Lazy` wrapper renders a centered spinner during chunk load:

```tsx
function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="animate-spin ..." />}>
    {children}
  </Suspense>
}
```

## SSE for Live Progress

The Upload page uses Server-Sent Events for real-time batch processing progress, with TanStack Query polling as fallback:

```tsx
// SSE connection
const { data, connected } = useSSE('/api/uploads/batches/:id/progress')

// Fallback polling (auto-stops on terminal state)
const { data } = useQuery({
  queryKey: ['batch-progress', batchId],
  queryFn: () => api.uploads.batch(batchId!),
  refetchInterval: (query) => {
    if (['completed', 'failed', 'review'].includes(query.state.data?.status)) return false
    return 2000
  },
})
```

## E2E Tests (Playwright)

```bash
# Ensure backend is running, then:
npm run test:e2e       # Run all E2E tests
npx playwright test    # Same as above
npx playwright test --ui  # Interactive UI mode
```

### Test Structure

```
e2e/
├── auth.spec.ts       # 8 tests:
│   - Register new user
│   - Login with registered user
│   - Show error on invalid login
│   - Navigate to forgot password page
│   - Forgot password shows success
│   - Logout clears session
│   - Protected route redirects to login
│
├── upload.spec.ts     # 4 tests:
│   - Navigate to upload page
│   - Upload page shows drag-and-drop zone
│   - Navigate to identities page
│   - Navigate to match page
```

### CI Integration

The Playwright config automatically starts the Vite dev server as a `webServer` and waits for it to be ready:

```ts
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
}
```

## Scripts

```bash
npm run dev            # Start dev server (Vite, hot reload)
npm run build          # Type check + production build → dist/
npm run preview        # Preview production build locally
npm run lint           # ESLint check (flat config)
npm run typecheck      # TypeScript type check (tsc -b)
npm run test:e2e       # Playwright E2E tests
```

## Environment

The frontend requires no `.env` file during development — the Vite dev server proxies `/api/*` to the backend:

```ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:4001', changeOrigin: true },
  },
}
```

For production, serve static files behind nginx:

```nginx
location /api/ {
    proxy_pass http://localhost:4001;
}
location / {
    root /var/www/frontend/dist;
    try_files $uri $uri/ /index.html;
}
```

## Production Build

```
dist/
├── index.html                   # 0.7 KB
├── assets/
│   ├── index-*.css              # 31 KB (gzip: 6 KB)
│   ├── index-*.js               # 264 KB (gzip: 83 KB)
```

Total: **~296 KB** uncompressed, **~90 KB** gzipped (with code splitting and tree-shaking).
