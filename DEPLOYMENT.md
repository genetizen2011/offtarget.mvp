# Deployment

## Required Environment Variables

Set these in Vercel → Project → Settings → Environment Variables.
Set them for Production, Preview, and Development.

| Variable | Description | Required |
|----------|-------------|----------|
| APP_JWT_SECRET | Random 32-char string. Generate: `openssl rand -base64 32` | Yes |
| NEXT_PUBLIC_SUPABASE_URL | From Supabase project Settings → API | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | From Supabase project Settings → API | Yes |
| SUPABASE_SERVICE_ROLE_KEY | From Supabase project Settings → API | Yes |
| NEXT_PUBLIC_APP_URL | Your Vercel deployment URL | Yes |

## DO NOT use @secret-name syntax in vercel.json

Vercel Secrets require pre-creation via CLI. Use plain values in the dashboard instead.

## Branch

Deploy from: main

Root directory: `/frontend`

## Verification

- `npm run build` completes locally with zero errors.
- `git push` triggers a Vercel deployment automatically.
- Vercel build log shows no missing environment variable errors.
- `https://your-app.vercel.app/api/analyze` returns JSON, not a 500 or fetch error.
- The app loads and Analyze works on the deployed URL.
- Register/Login forms work without "Failed to fetch".
