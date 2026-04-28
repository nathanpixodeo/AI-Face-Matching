# AI Face Matching

Face recognition API with AdaFace ML, team-based multi-tenancy, and identity management.

## Architecture

```
┌────────────��─┐    REST     ┌────────────────────┐
│  Node.js API  │ ────────> │  Python ML Service  │
│  (Fastify/TS) │ <──────── │  (FastAPI)          │
│               │            │                      │
│  Auth/JWT     │            │  AdaFace (primary)   │
│  Teams/Plans  │            │  DeepFace (fallback) │
│  Identities   │            │  RetinaFace detect   │
│  BullMQ jobs  │            │                      │
└──────┬───────┘            └──────────────────────┘
       │
       ├── MongoDB (data)
       └── Redis (BullMQ job queue)
```

**4 Docker services:** API, ML, MongoDB, Redis

## Tech Stack

| Layer | Technology | License |
|-------|-----------|---------|
| API | Fastify 5, TypeScript, Mongoose 8 | MIT |
| ML (primary) | AdaFace (99.82% LFW accuracy) | MIT |
| ML (fallback) | DeepFace + Facenet512 | MIT |
| Detection | RetinaFace | MIT |
| Job Queue | BullMQ + Redis | MIT |
| Database | MongoDB 7 | SSPL |
| Validation | Zod | MIT |

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
- API: http://localhost:4001
- Swagger Docs: http://localhost:4001/docs
- ML Service: http://localhost:8000
- MongoDB: localhost:27017
- Redis: localhost:6379

### Local Development

**Prerequisites:** Node.js 20+, MongoDB, Redis

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Start dev server (with hot reload)
npm run dev
```

**Python ML Service:**

```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Team | `GET/PUT /api/team`, `GET/POST/PUT/DELETE /api/team/members`, `PUT /api/team/plan` |
| Identity | `GET/POST /api/identities`, `GET/PUT/DELETE /api/identities/:id`, `GET /api/identities/:id/faces` |
| Upload | `POST /api/uploads`, `GET /api/uploads/batches`, `GET/PUT /api/uploads/batches/:id/review`, `GET /api/uploads/batches/:id/progress` (SSE) |
| Face Match | `POST /api/faces/match`, `GET /api/faces`, `GET /api/faces/:id`, `GET /api/faces/stats` |
| Images | `GET /api/images`, `GET /api/images/:id`, `DELETE /api/images/:id` |
| Workspaces | `GET/POST /api/workspaces`, `GET/PUT/DELETE /api/workspaces/:id` |
| Health | `GET /api/health` |

Full interactive docs at `/docs` (Swagger UI).

## Business Flow

1. **Register/Login** — creates user + team + free plan
2. **Create Identities** — known people profiles (name, description)
3. **Upload Images** — background job detects faces, extracts 512-D embeddings, auto-maps to known identities
4. **Review Mappings** — confirm/adjust/create identities for detected faces
5. **Face Match** — upload a photo, find matching identities ranked by similarity

## Plan Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Identities | 50 | 5,000 | Unlimited |
| Images | 500 | 50,000 | Unlimited |
| Matches/day | 50 | 5,000 | Unlimited |
| Storage | 500 MB | 10 GB | Unlimited |
| Team members | 2 | 10 | Unlimited |

## Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript
npm start            # Run production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run typecheck    # TypeScript type check
npm test             # Run Jest tests
npm run test:watch   # Jest watch mode
```

## Environment Variables

See [.env.example](.env.example) for all variables. Key ones:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Min 16 characters |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection |
| `ML_SERVICE_URL` | No | `http://localhost:8000` | Python ML service URL |
| `PORT` | No | `4001` | API server port |

## Project Structure

```
src/
  config/       # env validation, database, redis, seed
  plugins/      # Fastify plugins (auth, cors, helmet, etc.)
  modules/      # Feature modules (auth, team, identity, upload, face, area)
  models/       # Mongoose models (8 collections)
  jobs/         # BullMQ workers (face-detect, face-match)
  lib/          # Shared utilities (ml-client, file-storage, errors, response)
  types/        # TypeScript types + Fastify augmentations
  __tests__/    # Unit + integration tests

ml-service/     # Python FastAPI ML microservice
docker/         # Dockerfiles + docker-compose
docs/           # System docs, FE spec, progress tracker
```

## License

MIT
