# 🛡️ CrisisLens: Real-Time Disaster Resilience Network

**A resilient, local-first emergency response ecosystem.**

CrisisLens is a dual-ecosystem platform designed to maintain critical coordination during disasters when infrastructure is compromised. It bridges the gap between citizens on the ground and emergency responders in a command center.

---

## 🏗️ Project Overview

*   **The Problem**: During large-scale disasters, cellular and data networks often fail or become fragmented. Information becomes siloed, leading to delayed rescues and misallocated resources.
*   **The Solution**: 
    *   **Flutter Mobile App**: Acts as an offline-first **Lifeline for Citizens**. It allows for local data caching, proximity-based SOS fallbacks, and automatic synchronization.
    *   **React/Next.js Web Dashboard**: Serves as a **Real-Time Command Center** for responders, featuring geographic intelligence, incident clustering, and high-urgency alerting systems.

---

## ✨ Key Features

### 📡 Offline-First Architecture
Utilizes `shared_preferences` and local caching to ensure citizens can draft reports even with **zero connectivity**. Reports are automatically queued and synchronized with the Python backend the moment a network signal is detected.

### 🌐 Spatial Clustering & Intelligence
The backend uses the **Haversine formula** to analyze the proximity of incoming reports. It automatically groups nearby incidents into "Crisis Clusters," allowing responders to identify hotspots and issue targeted evacuation or precaution alerts.

### 🧠 NLP Intent Classification
Proprietary Python service logic that automatically extracts **hazard types** (e.g., Flood, Fire, Medical) and **severity levels** from unstructured text descriptions, ensuring the most critical cases are prioritized in the dashboard.

### 🆘 Smart SOS Fallback
A one-tap emergency system that bypasses standard APIs. If the main network is down, it triggers a **verified SOS package** containing exact GPS coordinates, current battery level, and user identity via SMS or WhatsApp to pre-configured emergency contacts.

### 🕹️ Interactive Command Center
A premium Next.js dashboard featuring:
*   **3D Preloader**: A React Three Fiber wireframe globe and radar initialized on load.
*   **Marker Clustering**: Clean visualization of thousands of incidents using `react-leaflet-cluster`.
*   **Live Heatmaps**: Real-time intensity mapping of disaster zones.

### 📸 Multi-Modal Evidence
Support for high-resolution `.jpg` and `.webp` uploads, allowing citizens to provide visual proof of hazards which the backend stores for situational assessment.

---

## 🛠️ Tech Stack

### 📱 Mobile (Flutter)
- **Framework**: Flutter / Dart
- **State Management**: Provider
- **Storage**: SharedPreferences (Offline-first cache)
- **Geolocation**: Geolocator API
- **Maps**: Flutter Map (OpenStreetMap)
- **Sensors**: Battery Plus (for SOS status)

### 🖥️ Web Frontend (React)
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS (v4)
- **Animations**: Framer Motion
- **3D Graphics**: React Three Fiber / Drei (Custom Radar/Globe)
- **Maps**: React Leaflet / Leaflet.js
- **Icons**: Lucide React

### ⚙️ Backend (FastAPI)
- **Language**: Python 3.10+
- **API Framework**: FastAPI
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **AI/NLP**: Custom classification microservices

---

## 🚀 Installation & Setup

### Prerequisites
- [Flutter SDK](https://docs.flutter.dev/get-started/install)
- [Node.js 20+](https://nodejs.org/)
- [Python 3.10+](https://www.python.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Optional, for containerized run)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
# Sync the database schema
python sync_db.py
# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Web Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The dashboard will be available at `http://localhost:3000`.

### 3. Mobile App Setup
```bash
cd mobile
flutter pub get
# Ensure an emulator or physical device is connected
flutter run
```

---

## 🔄 System Architecture & Data Flow

1.  **Reporting**: A user on the **Mobile App** submits an incident. If offline, the report is cached in `SharedPreferences`.
2.  **Synchronization**: Once online, the app pushes the report with GPS coordinates and image evidence to the **Python Backend**.
3.  **Intelligence Layer**: The backend runs the report through the **NLP classifier** to determine severity and compares coordinates using the **Haversine formula** to check if it belongs to an existing cluster.
4.  **Responders**: The **Web Dashboard** receives a real-time update via the API. Responders see a new cluster marker appear, can view the images, and trigger a broadcast alert back to all mobile users in that specific radius.

---

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.
