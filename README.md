# AI Face Matching

Face recognition API with AdaFace ML, team-based multi-tenancy, identity management, a customer React SPA, and an independently deployed platform-admin React app.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ app.example.com              admin.example.com               │
│ Customer React SPA           Admin React/Vite SPA             │
│ Team-scoped workspace        Separate build + auth storage    │
└─────────────────────────┬─────────────────┬─────────────────┘
                          │ REST (JWT Bearer)│
┌─────────────────────────┼───────────────────────────────────┐
│              Node.js API (Fastify 5 / TS)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth/JWT · Teams/Plans · Identities                  │   │
│  │  Upload · BullMQ Jobs · Face Match · Images           │   │
│  │  Workspaces · Password Reset · Platform guards        │   │
│  └──────────┬───────────────────────────────┬────────────┘   │
│             │                               │                │
│        ┌────┴────┐                    ┌────┴────┐           │
│        │ MongoDB │                    │  Redis  │           │
│        │  (data) │                    │ (queue) │           │
│        └─────────┘                    └─────────┘           │
└─────────────────────────────────────────────────────────────┘
                          │ HTTP
┌─────────────────────────┼───────────────────────────────────┐
│              Python ML Service (FastAPI)                     │
│  AdaFace (ONNX, primary) · DeepFace/Facenet512 (fallback)   │
│  RetinaFace detection · Age/Gender/Emotion estimation       │
└─────────────────────────────────────────────────────────────┘
```

The customer and admin apps are separate deployment units. The admin container serves `admin.example.com` and reverse-proxies `/api` to the Node API; customer and admin JWT storage is never shared.

## Tech Stack

| Layer | Technology | License |
|-------|-----------|---------|
| Backend API | Fastify 5, TypeScript, Mongoose 8 | MIT |
| Frontend | React 19, TypeScript 6, Vite 8 | MIT |
| Styling | Tailwind CSS 4 | MIT |
| Server State | TanStack Query 5 | MIT |
| ML (primary) | AdaFace (99.82% LFW accuracy) | MIT |
| ML (fallback) | DeepFace + Facenet512 | MIT |
| Detection | RetinaFace | MIT |
| Job Queue | BullMQ + Redis | MIT |
| Database | MongoDB 7 | SSPL |
| Validation | Zod | MIT |
| E2E Testing | Playwright | Apache 2.0 |

All dependencies are free and open-source.

## Quick Start

### Docker (recommended)

```bash
cp .env.example .env
# Edit .env with your JWT_SECRET (min 16 chars)

cd docker
docker compose up -d
```

Services:
- Admin frontend: http://localhost:3001
- API: http://localhost:4001
- Swagger Docs: http://localhost:4001/docs
- ML Service: http://localhost:8000
- MongoDB: localhost:27017
- Redis: localhost:6379

### Local Development

**Prerequisites:** Node.js 20+ (backend), Node.js 24+ (frontend), MongoDB, Redis, Python 3.11+

```bash
# Backend
npm install
cp .env.example .env
npm run dev                    # http://localhost:4001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                    # http://localhost:5173

# Platform admin (separate terminal)
cd ../admin-frontend
npm install
npm run dev                    # http://localhost:5176

# Python ML Service (separate terminal)
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Team | `GET/PUT /api/team`, `GET/POST/PUT/DELETE /api/team/members`, `PUT /api/team/plan` |
| Identity | `GET/POST /api/identities`, `GET/PUT/DELETE /api/identities/:id`, `GET /api/identities/:id/faces` |
| Upload | `POST /api/uploads`, `GET /api/uploads/batches`, `GET/PUT /api/uploads/batches/:id/review`, `GET /api/uploads/batches/:id/progress` (SSE) |
| Face Match | `POST /api/faces/match`, `GET /api/faces`, `GET /api/faces/:id`, `GET /api/faces/stats` |
| Images | `GET /api/images`, `GET /api/images/:id`, `DELETE /api/images/:id` |
| Workspaces | `GET/POST /api/workspaces`, `GET/PUT/DELETE /api/workspaces/:id` |
| Platform | `GET /api/platform/overview`, `GET/PUT /api/platform/teams`, `GET/PUT /api/platform/users` (superadmin only) |
| Health | `GET /api/health` |

Full interactive docs at `/docs` (Swagger UI).

## Localization

FaceMatch currently supports English (`en`), Vietnamese (`vi`), and French (`fr`) across both React applications and the Fastify API.

- The frontend language switcher persists the choice in `facematch.locale`, updates the document language, and sends `Accept-Language` plus `X-Locale` with every API request.
- The API prefers `X-Locale`, then negotiates `Accept-Language`, falls back to English, and returns `Content-Language` on every response.
- API success, known domain errors, and validation messages use the request locale without changing response data contracts.
- Both selectors use inline SVG flags for English (United Kingdom), Vietnamese, and French choices; no image asset service or third-party flag package is required.

### Add another locale

1. Add the locale code and display name to `frontend/src/i18n/locale.tsx`.
2. Add its frontend catalog and optional inline flag in `frontend/src/components/ui/LocaleFlag.tsx`.
3. Add the matching typed API catalog in `src/i18n/messages.ts`.
4. Add the small admin catalog in `admin-frontend/src/i18n.tsx` and its SVG flag in `admin-frontend/src/components/LocaleFlag.tsx`.

No route, controller, or API-client rewrite is required for a new language.

## Frontend Pages

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/login` | Login | No | Email + password sign-in |
| `/register` | Register | No | Create account + team |
| `/forgot-password` | Forgot Password | No | Request password reset email |
| `/reset-password/:token` | Reset Password | No | Set new password with token |
| `/` | Dashboard | Yes | Stats, recent batches, plan usage |
| `/identities` | Identities | Yes | Known people profiles (grid/list) |
| `/identities/:id` | Identity Detail | Yes | Profile + linked faces gallery |
| `/upload` | Upload | Yes | Drag & drop + SSE progress |
| `/upload/:batchId/review` | Upload Review | Yes | Face mapping review |
| `/match` | Face Match | Yes | Photo search with ranked results |
| `/images` | Images | Yes | Image library with status filters |
| `/images/:id` | Image Detail | Yes | Viewer + bbox face overlays |
| `/workspaces` | Workspaces | Yes | Workspace CRUD |
| `/settings` | Settings | Yes | Tabs: General, Members, Plan |

## Business Flow

1. **Register/Login** — creates user + team + free plan, or sign in with password
2. **Forgot/Reset Password** — request reset token, set new password
3. **Create Identities** — known people profiles (name, description)
4. **Upload Images** — drag-drop → background job detects faces → extracts 512-D embeddings → auto-maps to known identities (live SSE progress)
5. **Review Mappings** — confirm suggested matches, reassign, skip, or create new identities for unmatched faces
6. **Face Match** — upload a photo → find matching identities ranked by cosine similarity (0–100%)
7. **Manage** — browse image library, edit identity profiles, manage team members and workspace areas

## Plan Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Identities | 50 | 5,000 | Unlimited |
| Images | 500 | 50,000 | Unlimited |
| Matches/day | 50 | 5,000 | Unlimited |
| Storage | 500 MB | 10 GB | Unlimited |
| Team members | 2 | 10 | Unlimited |

## Scripts

### Backend
```bash
npm run dev          # Start dev server with hot reload (tsx watch)
npm run build        # Compile TypeScript → dist/
npm start            # Run production build
npm run lint         # ESLint check (src/**/*.ts)
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run typecheck    # TypeScript type check (tsc --noEmit)
npm test             # Run Jest tests (38 tests)
npm run test:watch   # Jest watch mode
npm run grant-superadmin -- user@example.com  # Promote an existing account after npm run build
```

### Superadmin Bootstrap

Create the first account through normal registration, then grant the platform role from a trusted machine with database access:

```bash
npm run build
npm run grant-superadmin -- admin@example.com
```

The command updates only the existing account's `isSuperadmin` flag. It does not change the user's team role. Sign out and sign in again after the command so the new JWT includes platform access.

## Admin Subdomain

Platform administration is a standalone Vite application, not a client-app route.

```
https://app.example.com       → customer frontend
https://admin.example.com     → admin frontend (:3001 on the host)
                                  └─ /api/* → API container (:4001 internally)
```

- Build and deploy `admin-frontend` independently; its production Docker image is `ghcr.io/<owner>/<repo>/admin-frontend`.
- Set `VITE_ADMIN_APP_URL=https://admin.example.com` in the customer frontend build. The customer sidebar opens that URL only for users whose session reports `isSuperadmin`.
- The admin app has a separate login and local-storage namespace. It calls `POST /api/auth/login` and `/api/platform/*` only.
- The server remains the authorization boundary: every platform endpoint requires `authenticate` and `requireSuperadmin`, even if a token is injected manually.
- Use [docker/nginx/admin.example.com.conf](docker/nginx/admin.example.com.conf) as the public Nginx virtual-host template. Add your TLS certificate in the host’s HTTPS virtual host; do not expose container port `3001` publicly.
- When an admin app calls the API directly instead of through its supplied same-origin Nginx proxy, include `https://admin.example.com` in `CORS_ORIGINS`.

The tag deployment workflow publishes the admin image, deploys it on loopback port `3001`, and pulls it along with the API/ML images. Install the public Nginx template once on the host and point `admin.example.com` DNS to that host.

### Frontend
```bash
npm run dev          # Vite dev server (:5173, proxies /api → :4001)
npm run build        # tsc -b + vite build → dist/
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run typecheck    # TypeScript type check (tsc -b)
npm run test:e2e     # Playwright E2E tests (auth + upload flows)
```

### Admin Frontend
```bash
cd admin-frontend
npm run dev          # Vite dev server (:5176, proxies /api → :4001)
npm run build        # tsc -b + vite build → dist/
npm run lint         # ESLint check
npm run typecheck    # TypeScript type check
```

## Project Structure

```
ai-face-matching/
├── src/                    # Backend API (Fastify/TypeScript)
│   ├── config/             # env validation, database, redis, seed
│   ├── plugins/            # Fastify plugins (auth, cors, helmet, etc.)
│   ├── modules/            # Feature modules (auth, team, identity, upload, face, area)
│   ├── models/             # Mongoose models (8 collections)
│   ├── jobs/               # BullMQ workers (face-detect, face-match)
│   ├── lib/                # Shared utilities (ml-client, file-storage, errors, response)
│   ├── types/              # TypeScript types + Fastify augmentations
│   └── __tests__/          # Unit + integration tests (Jest)
│
├── frontend/               # React SPA
│   ├── src/
│   │   ├── pages/          # 14 page components (lazy-loaded)
│   │   ├── components/     # UI kit (Button, Card, Modal, Badge, etc.) + Layout (AppLayout, AuthLayout, TopBar)
│   │   ├── contexts/       # AuthContext (JWT) + ToastContext (notifications)
│   │   ├── hooks/          # useSSE, useDebounce, usePagination
│   │   ├── lib/api.ts      # Typed API client (all endpoints)
│   │   └── types/          # TypeScript interfaces
│   ├── e2e/                # Playwright E2E tests
│   └── playwright.config.ts
│
├── admin-frontend/         # Separate React/Vite platform administrator app
│   ├── src/auth/           # Isolated administrator session state
│   ├── src/pages/          # Login + platform overview/team/user controls
│   └── src/lib/api.ts      # Only auth + platform API client
│
├── ml-service/             # Python FastAPI ML microservice
├── docker/                 # Dockerfiles + docker-compose (5 services)
├── docs/                   # System documentation, FE spec, architecture
└── .github/workflows/      # CI pipeline (lint → typecheck → test → build)
```

## Environment Variables

See [.env.example](.env.example) for all variables.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | Min 16 characters |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection |
| `ML_SERVICE_URL` | No | `http://localhost:8000` | Python ML service URL |
| `PORT` | No | `4001` | API server port |
| `JWT_EXPIRES_IN` | No | `2h` | Token expiry duration |
| `CORS_ORIGINS` | No | `*` | Comma-separated allowed origins (include both app/admin origins for direct API calls) |
| `UPLOAD_DIR` | No | `uploads` | File storage directory |
| `MAX_FILE_SIZE_MB` | No | `50` | Max upload file size |

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):

| Job | Tools | Runs on Push/PR to `main` |
|-----|-------|--------------------------|
| `backend-lint-typecheck` | ESLint + tsc | ✓ |
| `backend-test` | Jest (38 tests) | ✓ |
| `frontend-lint-typecheck` | ESLint + tsc -b | ✓ |
| `frontend-build` | Vite build | ✓ |
| `admin-frontend-lint-typecheck` | ESLint + tsc -b | ✓ |
| `admin-frontend-build` | Vite build | ✓ |
| `python-test` | Ruff + pytest | ✓ |

## License

MIT
