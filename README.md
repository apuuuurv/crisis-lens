# 🌍 CrisisLens: Disaster Resilience & Crisis Management

CrisisLens is a hyper-local disaster response coordination platform designed to empower citizens and responders with real-time data, AI-driven insights, and seamless communication during crises.

---

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### 📋 Prerequisites
- **Node.js**: v18.x or higher
- **Python**: v3.10.x or higher
- **npm**: (Installed with Node.js)
- **pip**: (Python package manager)

---

## 🛠️ Backend Setup (FastAPI)

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   # On Linux/macOS
   source venv/bin/activate  
   # On Windows
   .\venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**:
   Create a `.env` file in the `backend` folder (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   *Edit the `.env` file to set your `DATABASE_URL` (SQLite by default: `sqlite:///./disaster_network.db`).*

5. **Run the server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   *API will be available at: [http://localhost:8000](http://localhost:8000)*
   *Auto-docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)*

---

## 🎨 Frontend Setup (Next.js)

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   *Frontend will be available at: [http://localhost:3000](http://localhost:3000)*

---

## ✨ Features

- **Live Crisis Map**: Real-time visualization of incidents and resources using Leaflet.
- **Incident Reporting**: Easy reporting for citizens with category tagging and severity levels.
- **AI-Driven Risk Analysis**: Automated risk scoring for geographical zones.
- **Resource Management**: Tracking and dispatching responders (Ambulances, Fire Trucks).
- **Authentication**: Secure JWT-based login for Citizens and Responders.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS 4, Framer Motion, Lucide Icons.
- **Backend**: FastAPI, SQLAlchemy (ORM), Pydantic (Validation).
- **Database**: SQLite (Development) / PostgreSQL (Production).
- **Mapping**: React Leaflet / OpenStreetMap.
