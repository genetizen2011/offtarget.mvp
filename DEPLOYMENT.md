# Deployment Guide

This repository is a monorepo with:

- `frontend`: Next.js app for Vercel, including same-origin API routes
- `backend`: legacy FastAPI service retained for reference

## Frontend: Vercel

1. Import the repository into Vercel.
2. Set the root directory to `frontend`.
3. Set build command to `npm run build`.
4. Set output/framework to Next.js.
5. Add:

```env
APP_JWT_SECRET=replace-with-a-long-random-secret
```

The app calls only relative `/api/...` routes, so no public API base URL is required.

## Optional Legacy Backend

The FastAPI backend can still be run separately for reference or migration work.
If deploying it, add these backend variables:

```env
DATABASE_URL=postgresql://postgres:YOUR-PASSWORD@db.rxmacxsziqsqyzzdljrk.supabase.co:5432/postgres
JWT_SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
SUPABASE_URL=https://rxmacxsziqsqyzzdljrk.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

`DATABASE_URL` may use either `postgresql://` or `postgresql+psycopg://`.

## Post-Deploy Checklist

1. Register a test account from the frontend.
2. Run an analysis.
3. Save the analysis and confirm it appears on `/history`.
4. Click `Generate AI Insight` and confirm the local explanation loads.

## Security Notes

- Never commit real `.env` files.
- Use a long random `APP_JWT_SECRET` in production.
- The in-app auth and cloud history store are in-memory for this MVP; use a database-backed store before relying on accounts for durable production data.
