#!/bin/bash
set -euo pipefail

TAG="${1:?Usage: deploy.sh <tag> <gh_user> <gh_token>}"
GH_USER="${2:?}"
GH_TOKEN="${3:?}"

APP_DIR="/opt/ai-face-matching"
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
REPO="ghcr.io/nathanpixodeo/ai-face-matching"

echo "==> Deploying $TAG at $(date)"

echo "$GH_TOKEN" | docker login ghcr.io -u "$GH_USER" --password-stdin

export API_IMAGE="$REPO/api:$TAG"
export ML_IMAGE="$REPO/ml:$TAG"

if [ ! -f "$APP_DIR/.env" ]; then
  echo "==> WARNING: $APP_DIR/.env not found — creating template"
  cat > "$APP_DIR/.env" <<'ENVEOF'
# Server
NODE_ENV=production
PORT=4001

# Database (aaPanel host services)
MONGO_URI=mongodb://host.docker.internal:27017/face-service
REDIS_URL=redis://host.docker.internal:6379

# ML Service (Docker internal)
ML_SERVICE_URL=http://ml-service:8000

# JWT (CHANGE THIS!)
JWT_SECRET=CHANGE-ME-minimum-16-characters
JWT_EXPIRES_IN=2h

# CORS
CORS_ORIGINS=*

# Upload
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE_MB=50
ENVEOF
  echo "==> IMPORTANT: Edit $APP_DIR/.env with your production values before first run"
fi

echo "==> Pulling images..."
docker compose -f "$COMPOSE_FILE" pull api ml-service

echo "==> Starting services..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Waiting for health checks..."
sleep 10

if docker compose -f "$COMPOSE_FILE" ps | grep -q "unhealthy"; then
  echo "==> WARNING: Some services are unhealthy"
  docker compose -f "$COMPOSE_FILE" ps
  exit 1
fi

echo "==> Deploy complete: $TAG"
docker compose -f "$COMPOSE_FILE" ps
