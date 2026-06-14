# Frontend Architecture

> Detailed technical documentation for the React SPA. Last updated: 2026-06-14

## 1. Build Pipeline

```
Source (TSX/TS/CSS)
    │
    ├── Vite 8
    │   ├── @vitejs/plugin-react (JSX transform)
    │   ├── @tailwindcss/vite (CSS processing)
    │   └── TypeScript 6 (type checking)
    │
    └── Output
        ├── dist/index.html
        ├── dist/assets/index-{hash}.js  (~264 KB)
        └── dist/assets/index-{hash}.css (~31 KB)
```

- **Tree-shaking**: Enabled by default (ESM)
- **Code splitting**: Route-level with `React.lazy()` — each page is a separate chunk
- **CSS purging**: Tailwind CSS v4 removes unused styles at build time
- **Gzip**: Vite generates `.gz` files for nginx `gzip_static`
- **Total**: ~296 KB uncompressed, ~90 KB gzipped

## 2. State Management Strategy

| Concern | Solution | Rationale |
|---------|----------|-----------|
| Server state | TanStack Query | Caching, refetching, stale-while-revalidate |
| Auth state | React Context + useMemo | JWT decode, localStorage sync |
| UI state (modals, toasts) | Local `useState` | Scoped, no global pollution |
| Form state | Local `useState` | Simple controlled components |
| SSE / realtime | `useSSE` hook | Lightweight EventSource wrapper |

### TanStack Query Configuration

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,     // 30s before refetch
      refetchOnWindowFocus: false,
    },
  },
})
```

### Cache Invalidation Pattern

```ts
const mutation = useMutation({
  mutationFn: () => api.identities.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['identities'] })
  },
})
```

## 3. Auth Flow

```
┌──────────────┐     POST /api/auth/login         ┌──────────────┐
│  Login Page  │ ──────────────────────────────>  │  Backend API │
│              │ <──────────────────────────────  │              │
│              │    { user, token }               │              │
└──────┬───────┘                                  └──────────────┘
       │
       │ decode JWT → validate exp → store in localStorage
       ▼
┌──────────────┐
│ AuthContext   │
│ - token state │
│ - user (useMemo from token) │
│ - login/register/logout     │
└──────┬───────┘
       │
       ▼
┌──────────────┐     Authorization: Bearer <token>
│  All Pages   │ ──────────────────────────────>  API calls
└──────────────┘
```

### Token lifecycle:
1. **Login/Register** → API returns `{ user, token }` → `setToken()` stores in localStorage via effect
2. **App mount** → `useState` reads token from localStorage, validates JWT `exp` claim synchronously
3. **Expired token** → `parseToken()` returns null → token state stays `null` → redirect to login
4. **Logout** → `setToken(null)` → effect clears localStorage → redirected to `/login`

### Auth guards:

```tsx
<Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password/:token" element={<ResetPassword />} />
</Route>

<Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
  <Route path="/" element={<Dashboard />} />
  ...
</Route>
```

- `ProtectedRoute`: Redirects to `/login` if no token (shows spinner during loading)
- `PublicRoute`: Redirects to `/` if token exists (hides content during loading)

### Password Reset Flow:

```
ForgotPassword Page                  ResetPassword Page
       │                                    │
       │ POST /auth/forgot-password          │ POST /auth/reset-password
       │   { email }                         │   { token, password }
       ▼                                    ▼
┌──────────────┐                    ┌──────────────┐
│  Auth Service │                    │  Auth Service │
│ - find user   │                    │ - hash token  │
│ - gen random  │                    │ - find user   │
│   token       │                    │   by hash+exp │
│ - store hash  │                    │ - hash new pw │
│   + 1h expiry │                    │ - clear token │
│ - return raw  │                    └──────────────┘
│   token       │
│ (for dev; in     │
│  prod, send      │
│  email instead)  │
└──────────────┘
```

## 4. Routing Structure

```
<BrowserRouter>
  <AuthProvider>
    <ToastProvider>
      <Routes>
        <!-- Public: centered card layout -->
        <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        <!-- Protected: sidebar + topbar layout -->
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/identities" ... />
          <Route path="/identities/:id" ... />
          <Route path="/upload" ... />
          <Route path="/upload/:batchId/review" ... />
          <Route path="/match" ... />
          <Route path="/images" ... />
          <Route path="/images/:id" ... />
          <Route path="/workspaces" ... />
          <Route path="/settings" ... />
        </Route>

        <!-- Catch-all -->
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ToastProvider>
  </AuthProvider>
</BrowserRouter>
```

## 5. Code Splitting

All 14 pages use `React.lazy()` for route-level code splitting. Each page is compiled into a separate JavaScript chunk loaded only when the user navigates to that route.

```tsx
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
// ... all 14 pages

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="animate-spin ..." />}>
    {children}
  </Suspense>
}

<Route path="/" element={<Lazy><Dashboard /></Lazy>} />
```

Benefits:
- Initial bundle reduced from ~296 KB to ~50 KB (core framework + layout)
- Individual page chunks: 2-15 KB each
- Perfect Lighthouse score on initial load

## 6. Component Tree (AppLayout)

```
AppLayout
├── Sidebar
│   ├── Logo (FaceMatch / FM)
│   ├── NavLinks (7 items, active highlight with indicator)
│   └── Collapse toggle (expand/collapse icons)
├── TopBar
│   ├── Hamburger (mobile only)
│   └── UserMenu (data-testid="user-menu")
│       ├── Avatar (initials in primary-600 circle)
│       ├── Name + Email
│       └── Dropdown
│           ├── Profile → /settings
│           └── Sign Out (red)
└── <main>
    └── <Outlet /> (page content)
```

## 7. Component State Contract

Every page component exposes these states via TanStack Query:

```tsx
function Page() {
  const { data, isLoading, isError, error, refetch } = useQuery({...})

  if (isLoading) return <Skeleton />
  if (isError) return <ErrorBox message={error.message} onRetry={refetch} />
  if (!data?.length) return <EmptyState title="..." description="..." action={...} />
  return <ActualContent data={data} />
}
```

### Error handling pattern:

```tsx
// Shared ErrorBox component (defined outside render to avoid lint errors)
function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
      <p className="text-sm text-red-600 flex-1">Failed to load data</p>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        <RefreshCw className="w-4 h-4 mr-1" />Retry
      </Button>
    </div>
  )
}
```

## 8. Toast Notification System

```tsx
const { toast } = useToast()
toast('success', 'Upload complete')   // Green, bottom-right
toast('error', 'Failed to load')      // Red
toast('info', 'Processing...')        // Blue

// Auto-dismisses after 4 seconds
// Stacked bottom-right with fade-in animation
// Click X to dismiss early
```

## 9. API Client Architecture

```ts
// src/lib/api.ts — typed request helper
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
```

Response format from API:

```json
{ "success": true, "data": { ... }, "message": "OK" }
```

Error format:

```json
{ "success": false, "data": null, "message": "Error description" }
```

## 10. SSE for Live Progress

The Upload page uses Server-Sent Events for real-time batch processing progress, with TanStack Query polling as fallback:

```tsx
export function useSSE(url: string) {
  const [data, setData] = useState<unknown>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const es = new EventSource(url)
    es.onopen = () => setConnected(true)
    es.onmessage = e => {
      try { setData(JSON.parse(e.data)) } catch { setData(e.data) }
    }
    es.onerror = () => { setConnected(false); es.close() }
    return () => es.close()
  }, [url])

  return { data, connected }
}
```

TanStack Query polling:

```ts
const { data } = useQuery({
  queryKey: ['batch-progress', batchId],
  queryFn: () => api.uploads.batch(batchId!),
  refetchInterval: (query) => {
    if (['completed', 'failed', 'review'].includes(query.state.data?.status)) return false
    return 2000
  },
})
```

## 11. E2E Testing (Playwright)

```bash
npm run test:e2e    # Headless (CI mode)
npx playwright test --ui  # Interactive UI mode
```

### Configuration (`playwright.config.ts`):

- **Test dir**: `./e2e`
- **Base URL**: `http://localhost:5173`
- **Browser**: Chromium (Desktop Chrome)
- **Web server**: Auto-starts Vite dev server before tests
- **Retries**: 2 in CI, 0 locally
- **Trace**: On first retry only

### Test Files:

**`e2e/auth.spec.ts`** (8 tests):
- Register a new user
- Login with registered user
- Show error on invalid login
- Navigate to forgot password page
- Forgot password shows success
- Logout clears session
- Protected route redirects to login

**`e2e/upload.spec.ts`** (4 tests):
- Navigate to upload page
- Upload page shows drag-and-drop zone
- Navigate to identities page
- Navigate to match page

## 12. Performance Optimizations

| Technique | Implementation |
|-----------|---------------|
| Bundle size | Vite tree-shaking + code splitting, ~90KB gzipped total |
| Image lazy loading | Native `loading="lazy"` on grid images |
| Debounced search | 300ms debounce for identity search |
| Query caching | TanStack Query staleTime: 30s |
| Conditional polling | Stops polling when batch reaches terminal state |
| Skeleton placeholders | Shimmer loading states matching content layout |
| Route-level code splitting | `React.lazy()` for all 14 pages |
| Auth init optimization | Token parsed in `useState` initializer (no effect cascade) |

## 13. Accessibility

- All interactive elements are `<button>` or `<a>` tags
- Form inputs have associated `<label>` elements
- Color is not the only indicator (text + badge variants)
- Focus visible outlines on interactive elements
- Semantic HTML structure (`<nav>`, `<main>`, `<header>`, `<aside>`)

## 14. Responsive Breakpoints

| Breakpoint | Width | Sidebar | Grid |
|-----------|-------|---------|------|
| Mobile | < 768px | Hidden (hamburger) | 1-2 cols |
| Tablet | 768-1024px | Collapsed (icons only) | 2-3 cols |
| Desktop | > 1024px | Expanded (icons + labels) | 3-5 cols |

## 15. Environment Variables

The frontend has no runtime `.env` variables in development. The API proxy is compile-time only (`vite.config.ts`).

For production deployment with a different API URL:

```bash
VITE_API_URL=https://api.example.com npm run build
```

Then update `vite.config.ts` or `src/lib/api.ts` to read `import.meta.env.VITE_API_URL`.

## 16. Production Build Output

```
dist/
├── index.html                       # 0.7 KB
├── assets/
│   ├── index-{hash}.css             # 31 KB (gzip: 6 KB)
│   ├── index-{hash}.js              # 264 KB (gzip: 83 KB) — core + layout
│   ├── Login-{hash}.js              # ~3 KB (lazy)
│   ├── Register-{hash}.js           # ~4 KB (lazy)
│   ├── Dashboard-{hash}.js          # ~8 KB (lazy)
│   ├── Identities-{hash}.js         # ~6 KB (lazy)
│   ├── IdentityDetail-{hash}.js     # ~5 KB (lazy)
│   ├── Upload-{hash}.js             # ~7 KB (lazy)
│   ├── UploadReview-{hash}.js       # ~10 KB (lazy)
│   ├── FaceMatch-{hash}.js          # ~5 KB (lazy)
│   ├── Images-{hash}.js             # ~4 KB (lazy)
│   ├── ImageDetail-{hash}.js        # ~5 KB (lazy)
│   ├── Workspaces-{hash}.js         # ~5 KB (lazy)
│   ├── Settings-{hash}.js           # ~6 KB (lazy)
│   ├── ForgotPassword-{hash}.js     # ~2 KB (lazy)
│   └── ResetPassword-{hash}.js      # ~3 KB (lazy)
```

Total: **~296 KB** uncompressed, **~90 KB** gzipped.
