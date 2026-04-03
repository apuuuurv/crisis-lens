# CrisisLens

CrisisLens is a hyper-local disaster response coordination platform for reporting incidents, monitoring live maps, dispatching resources, and coordinating crisis response.

## What Teammates Need

Before running the project, each teammate needs:

- Git
- Docker Desktop
- A local copy of the repo
- A `backend/.env` file with valid project keys

Recommended approach:

- Use Docker dev mode
- This avoids Node/Python version mismatch across devices
- Frontend and backend run on the same ports for everyone

## Clone The Repo

```bash
git clone https://github.com/apuuuurv/crisis-lens.git
cd crisis-lens
```

## Environment Setup

Create `backend/.env`.

You can start from:

```bash
cp backend/.env.example backend/.env
```

Then update the values.

Typical fields used by the app:

```env
DATABASE_URL=...
SECRET_KEY=...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GEMINI_API_KEY=...
```

Important:

- Do not commit `backend/.env`
- Share real keys securely with teammates
- If `GEMINI_API_KEY` is missing, the backend will still start, but image AI analysis will fall back gracefully

## Recommended: Run With Docker Dev

Start Docker Desktop first.

Then from the repo root:

```bash
docker compose -f docker-compose.dev.yml up --build
```

This starts:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

Why this is recommended:

- Pinned Node and Python versions
- Fewer dependency/version issues across devices
- Frontend hot reload
- Backend hot reload

## Production-Style Docker Run

If someone wants a cleaner non-dev container run:

```bash
docker compose up --build
```

This also serves:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## If Ports 3000 or 8000 Are Busy

The project needs:

- `3000` for frontend
- `8000` for backend

If Docker fails with a port error, stop the process already using that port.

On Windows PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 3000,8000 -State Listen
Stop-Process -Id <PID> -Force
```

Common blockers we hit during setup:

- old Next.js dev server
- old Uvicorn backend
- VS Code extension helper processes using port `3000`

## Local Non-Docker Setup

Use this only if you do not want Docker.

### Backend

```bash
cd backend
python -m venv venv
```

Activate the environment:

Windows:

```bash
.\venv\Scripts\activate
```

macOS/Linux:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
pip install SQLAlchemy google-genai
```

Run backend:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev -- --webpack --port 3000
```

## Teammate Pull Workflow

Whenever teammates pull new changes:

```bash
git pull origin main
```

Then:

1. Check whether `backend/.env` still has the required values
2. Rebuild containers if Docker files or dependencies changed

```bash
docker compose -f docker-compose.dev.yml up --build
```

If they are using local non-Docker setup:

```bash
cd frontend && npm install
cd ../backend && pip install -r requirements.txt
```

## Known Setup Notes

- Docker compose files read environment from `backend/.env`
- Frontend uses `NEXT_PUBLIC_API_URL=http://localhost:8000`
- Some new frontend dependencies were added for map clustering and heatmap support
- If a teammate gets `Module not found` errors after pull, they should rerun `npm install`
- If a teammate gets backend import/dependency issues locally, Docker dev mode is the preferred fix

## Useful Commands

Stop Docker dev stack:

```bash
docker compose -f docker-compose.dev.yml down
```

Stop production-style Docker stack:

```bash
docker compose down
```

Rebuild from scratch:

```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build
```

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS, React Leaflet
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: PostgreSQL or SQLite
- AI/Image Analysis: Gemini

