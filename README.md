# OffTarget MVP

A production-ready MVP genome engineering web app for CRISPR guide RNA discovery. The frontend is built with Next.js App Router, TypeScript, and Tailwind CSS. The backend is a FastAPI service that scans NGG PAM sites, generates 20 nt upstream guides, scores efficiency, classifies risk, and returns structured results.

## Local Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

On Windows PowerShell, activate the virtual environment with:

```powershell
.\.venv\Scripts\Activate.ps1
```

## Environment Variables

Set this for deployed frontend builds:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-service.example.com
```

Set this for deployed backend CORS:

```bash
FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
```

## Deployment

For the full production checklist, see `DEPLOYMENT.md`.

### Vercel Frontend

1. Import the repository into Vercel.
2. Set the root directory to `frontend`.
3. Add `NEXT_PUBLIC_API_URL` pointing to the deployed backend.
4. Deploy with the default Next.js build command, `npm run build`.

### Railway or Render Backend

1. Create a Python web service from the repository.
2. Set the root directory to `backend`.
3. Install dependencies with `pip install -r requirements.txt`.
4. Use this start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

5. Add `FRONTEND_ORIGIN` with the deployed Vercel URL.
