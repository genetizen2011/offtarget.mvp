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

Copy `.env.example` to `.env.local` for local development. The Next.js app also
loads `frontend/.env.local` when running from `frontend/`.

```env
APP_JWT_SECRET=your-random-32-char-secret-here
```

## Deployment

For the full production checklist, see `DEPLOYMENT.md`.

### Vercel

1. Import the repository into Vercel.
2. Deploy from `main`; `vercel.json` sets the root directory to `frontend`.
3. Add the variables from `.env.example` in Vercel Project Settings.
4. Deploy with the default Next.js build command, `npm run build`.
