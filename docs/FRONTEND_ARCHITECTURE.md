# Frontend Architecture

> Detailed technical documentation for the React SPA.

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
        ├── dist/assets/index-{hash}.js
        └── dist/assets/index-{hash}.css
```

- **Tree-shaking**: Enabled by default (ESM)
- **Code splitting**: Automatic per-route chunks (future enhancement)
- **CSS purging**: Tailwind CSS v4 removes unused styles at build time
- **Gzip**: Vite generates `.gz` files for nginx `gzip_static`

## 2. State Management Strategy

| Concern | Solution | Rationale |
|---------|----------|-----------|
| Server state | TanStack Query | Caching, refetching, stale-while-revalidate |
| Auth state | React Context | Simple, no external deps, JWT-only |
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
// After a mutation, invalidate related queries
const mutation = useMutation({
  mutationFn: () => api.identities.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['identities'] })
    // toast notification
  },
})
```

## 3. Auth Flow

```
┌──────────────┐     POST /api/auth/login     ┌──────────────┐
│  Login Page  │ ──────────────────────────>  │  Backend API │
│              │ <──────────────────────────  │              │
│              │    { user, token }           │              │
└──────┬───────┘                              └──────────────┘
       │
       │ store token in localStorage
       ▼
┌──────────────┐
│ AuthContext   │
│ - sets token  │
│ - sets user   │
└──────┬───────┘
       │
       ▼
┌──────────────┐     Authorization: Bearer <token>
│  AppLayout   │ ──────────────────────────────>  API calls
└──────────────┘
```

### Token lifecycle:
1. **Login/Register** → receives `{ token, user }` → stores in `localStorage`
2. **App mount** → reads token from `localStorage` → decodes JWT payload → sets user
3. **Expired token** → JWT decode detects `exp` → auto-logout
4. **Logout** → clears `localStorage` → redirects to `/login`

### Auth guards:

```tsx
<Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
  <Route path="/login" element={<Login />} />
</Route>

<Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
  <Route path="/" element={<Dashboard />} />
</Route>
```

- `ProtectedRoute`: Redirects to `/login` if no token
- `PublicRoute`: Redirects to `/` if token exists

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

## 5. Component Tree (AppLayout)

```
AppLayout
├── Sidebar
│   ├── Logo (FaceMatch / FM)
│   ├── NavLinks (7 items, active highlight)
│   └── Collapse toggle
├── TopBar
│   ├── Hamburger (mobile)
│   └── UserMenu
│       ├── Avatar (initials)
│       ├── Name + Email
│       └── Dropdown
│           ├── Profile → /settings
│           └── Sign Out
└── <main>
    └── <Outlet /> (page content)
```

## 6. Component State Contract

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

### EmptyState components:

```tsx
<EmptyState
  icon={<Users className="w-8 h-8" />}
  title="No identities yet"
  description="Create your first identity to start organizing faces."
  action={<Button onClick={...}>Create Identity</Button>}
/>
```

### Error handling:

```tsx
// Inline error box with retry
<div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
  <p className="text-sm text-red-600 flex-1">{error.message}</p>
  <Button variant="ghost" size="sm" onClick={refetch}>
    <RefreshCw className="w-4 h-4 mr-1" />Retry
  </Button>
</div>
```

## 7. Toast Notification System

```tsx
// In any component:
const { toast } = useToast()
toast('success', 'Upload complete')
toast('error', 'Failed to load data')
toast('info', 'Processing started')

// Auto-dismisses after 4 seconds
// Stacked bottom-right
// Types: success (green), error (red), info (blue)
```

## 8. API Client Architecture

```ts
// All API calls are centralized in src/lib/api.ts

// Typed request helper
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

Response format expected from API:

```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```

Error format:

```json
{
  "success": false,
  "data": null,
  "message": "Error description"
}
```

## 9. SSE for Live Progress

The Upload page uses Server-Sent Events for real-time batch processing progress:

```tsx
export function useSSE(url: string) {
  const [data, setData] = useState<any>(null)
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

TanStack Query polling as fallback:

```ts
const { data } = useQuery({
  queryKey: ['batch-progress', batchId],
  queryFn: () => api.uploads.batch(batchId!),
  enabled: !!batchId,
  refetchInterval: (query) => {
    const d = query.state.data
    if (['completed', 'failed', 'review'].includes(d?.status)) return false
    return 2000
  },
})
```

## 10. Performance Optimizations

| Technique | Implementation |
|-----------|---------------|
| Bundle size | Vite tree-shaking, ~101KB gzipped total |
| Image lazy loading | Native `loading="lazy"` on grid images |
| Debounced search | 300ms debounce for identity search |
| Query caching | TanStack Query staleTime: 30s |
| Conditional polling | Stops polling when batch reaches terminal state |
| Skeleton placeholders | Shimmer loading states matching content layout |
| Route-level code splitting | Ready for `React.lazy()` when needed |
| Optimistic updates | Not implemented yet (future) |

## 11. Accessibility

- All interactive elements are `<button>` or `<a>` tags
- Form inputs have associated `<label>` elements
- Color is not the only indicator (text + badge variants)
- Focus visible outlines on interactive elements
- Semantic HTML structure (`<nav>`, `<main>`, `<header>`, `<aside>`)

## 12. Responsive Breakpoints

| Breakpoint | Width | Sidebar | Grid |
|-----------|-------|---------|------|
| Mobile | < 768px | Hidden (hamburger) | 1-2 cols |
| Tablet | 768-1024px | Collapsed (icons) | 2-3 cols |
| Desktop | > 1024px | Expanded | 3-5 cols |

## 13. Environment Variables

The frontend currently has no runtime `.env` variables. The API proxy is compile-time only (`vite.config.ts`).

For production deployment with a different API URL, build with:

```bash
VITE_API_URL=https://api.example.com npm run build
```

And update `vite.config.ts` or `src/lib/api.ts` to read `import.meta.env.VITE_API_URL`.

## 14. Future Enhancements

- [ ] Route-level code splitting with `React.lazy()`
- [ ] Optimistic updates for identity rename / face assignment
- [ ] Virtual scrolling for large identity lists
- [ ] Dark mode via Tailwind `prefers-color-scheme`
- [ ] E2E tests with Playwright
- [ ] PWA support with service worker
- [ ] Internationalization (i18n)
