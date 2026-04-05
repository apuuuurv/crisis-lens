# CrisisLens Production Deployment Guide 🚀

This guide provides step-by-step instructions for deploying the CrisisLens ecosystem (FastAPI Backend, PostgreSQL, and Next.js Frontend) to production using Render and Vercel.

---

## 🏗️ Phase 1: Managed PostgreSQL (Render)

1.  Log in to [Render.com](https://dashboard.render.com).
2.  Click **New +** and select **PostgreSQL**.
3.  **Name**: `crisislens-db`
4.  **Database**: `crisislens`
5.  **User**: Select a username (e.g., `admin`).
6.  Click **Create Database**.
7.  **IMPORTANT**: Copy the **Internal Database URL** (e.g., `postgres://user:password@host:port/database`). This is what your backend will use to communicate with the DB within Render's private network.

---

## ⚙️ Phase 2: FastAPI Backend Deployment (Render)

1.  Click **New +** and select **Web Service**.
2.  Connect your GitHub repository.
3.  **Name**: `crisislens-backend`
4.  **Runtime**: `Docker` (Render will automatically detect your `backend/Dockerfile`).
5.  **Root Directory**: `backend` (ensure the build context points here).
6.  Click **Advanced** to add **Environment Variables**:
    *   `DATABASE_URL`: Paste the **Internal Database URL** from Phase 1.
    *   `SECRET_KEY`: Generate a long random string (used for JWT).
    *   `ALLOWED_ORIGINS`: Your future Vercel URL (e.g., `https://crisislens.vercel.app`).
    *   `GEMINI_API_KEY`: Your Google AI key.
7.  Click **Create Web Service**.

> [!NOTE]
> **Database Migrations**: Your `main.py` is configured to run `Base.metadata.create_all(bind=engine)` and `ensure_schema_updates()` on startup. This means your schema will be automatically created or updated every time the container starts.

---

## 🌐 Phase 3: Next.js Frontend Deployment (Vercel)

1.  Go to [Vercel.com](https://vercel.com).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Root Directory**: `frontend`.
5.  **Framework Preset**: `Next.js`.
6.  Under **Environment Variables**, add:
    *   `NEXT_PUBLIC_API_URL`: Use your live Render Web Service URL (e.g., `https://crisislens-backend.onrender.com`).
7.  Click **Deploy**.

---

## 🌉 Phase 4: Connecting the Ecosystem (Network Sync)

1.  Once Vercel gives you a production URL, go back to the **Render Dashboard**.
2.  Select your `crisislens-backend` service -> **Environment**.
3.  Update `ALLOWED_ORIGINS` to include your new Vercel URL (comma-separated).
4.  Render will automatically redeploy with the new security settings.

---

## 🛠️ Phase 5: 3D Preloader Proofing

To ensure the **React Three Fiber** and **Three.js** dependencies don't break during the Vercel production build:
-   The `Preloader.tsx` component uses a `isMounted` client-side check.
-   This avoids "window is not defined" errors during Vercel's Static Site Generation (SSG).

---

## ✅ Phase 6: Connection Verification

Use the provided `test_connection.py` script to verify that your production endpoints are reachable.

```bash
# Run from your local machine
python test_connection.py --url https://your-backend-render-url.com
```
