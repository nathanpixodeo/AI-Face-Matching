# AI Face Matching

Face recognition API with AdaFace ML, team-based multi-tenancy, identity management, and a production-grade React SPA.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React SPA (Vite 8)                        │
│  TypeScript 6 · Tailwind 4 · TanStack Query 5               │
│  React Router 7 · Lucide Icons                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  AuthProvider · ToastProvider · QueryClientProvider    │  │
│  │  Routes: 14 pages (lazy-loaded)                       │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │ REST (JWT Bearer)
┌─────────────────────────┼───────────────────────────────────┐
│              Node.js API (Fastify 5 / TS)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth/JWT · Teams/Plans · Identities                  │   │
│  │  Upload · BullMQ Jobs · Face Match · Images           │   │
│  │  Workspaces · Password Reset                          │   │
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

**5 Docker services:** Frontend (nginx), API (Node), ML (Python), MongoDB, Redis

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
- Frontend: http://localhost:3000
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
| Health | `GET /api/health` |

Full interactive docs at `/docs` (Swagger UI).

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
```

### Frontend
```bash
npm run dev          # Vite dev server (:5173, proxies /api → :4001)
npm run build        # tsc -b + vite build → dist/
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run typecheck    # TypeScript type check (tsc -b)
npm run test:e2e     # Playwright E2E tests (auth + upload flows)
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
| `CORS_ORIGINS` | No | `*` | Comma-separated allowed origins |
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
| `python-test` | Ruff + pytest | ✓ |

## License

MIT
