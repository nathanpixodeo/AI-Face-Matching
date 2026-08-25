# FaceMatch Platform Admin

Independent React/Vite application for `admin.example.com`. It is not bundled with the customer workspace application.

## Local development

```bash
cp .env.example .env.local
npm ci
npm run dev # http://127.0.0.1:5176
```

Vite proxies `/api` to `VITE_API_PROXY_TARGET` (`http://localhost:4001` by default). Production keeps the same-origin `/api` path: the admin nginx container proxies it to the API service.

## Security boundary

- Admin auth uses its own storage keys: `facematch.admin.token` and `facematch.admin.user`.
- Login is accepted by the UI only when the API response declares `isSuperadmin: true`.
- The UI is not the authority: every `/api/platform/*` route still requires a valid JWT and the backend `requireSuperadmin` guard.
- Customer app tokens are never read or transferred into this app.

## Commands

```bash
npm run lint
npm run typecheck
npm run build
```
