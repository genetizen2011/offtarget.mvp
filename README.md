# OffTarget MVP

A production-ready MVP genome engineering web app for CRISPR guide RNA discovery. The frontend is built with Next.js App Router, TypeScript, Tailwind CSS, and same-origin Next.js API routes for analysis, auth, saved history, and insights.

## Local Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.

## Environment Variables

Copy `frontend/.env.example` to `frontend/.env.local` for local development:

```env
APP_JWT_SECRET=replace-with-a-long-random-secret
```

## Deployment

For the full production checklist, see `DEPLOYMENT.md`.

### Vercel

1. Import the repository into Vercel.
2. Set the root directory to `frontend`.
3. Add `APP_JWT_SECRET` as a project environment variable.
4. Deploy with the default Next.js build command, `npm run build`.
