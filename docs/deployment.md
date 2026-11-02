# Luma deployment

The repository contains two independent deployable applications:

- `backend/` is a Node service for Render.
- `frontend/` is a Vite application for Vercel.

## Render backend

Create a Render Web Service from this repository, or apply [`render.yaml`](../render.yaml).

- Root directory: `backend`
- Build command: `npm ci`
- Start command: `npm start`
- Health check: `/health/live`

Set the variables in [`backend/.env.example`](../backend/.env.example). In production,
`SESSION_SECRET`, `DATABASE_URL`, `ALLOWED_ORIGIN`, Google OAuth values, and AI provider
values must be configured in Render. Set `GOOGLE_REDIRECT_URI` to:

```text
https://<render-service>.onrender.com/api/auth/google/callback
```

## Vercel frontend

Import the same repository as a Vercel project with the root directory set to `frontend`.
Vercel detects the Vite build automatically. Set:

```text
VITE_API_URL=https://<render-service>.onrender.com
```

Set the backend `ALLOWED_ORIGIN` to the deployed Vercel origin, then add the callback URL
above to the Google OAuth client.

## GitHub Actions

`backend.yml` runs dependency audits, backend tests, backend type-checking, and the
frontend production build. `deploy.yml` can deploy automatically from `main` when these
repository secrets are configured:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `RENDER_DEPLOY_HOOK_URL`

Without those secrets, deployment remains managed by the native Vercel and Render
Git integrations.
