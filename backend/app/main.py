import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.models import core
from app.api.auth_routes import router as auth_router
from app.api.incident_routes import router as incident_router 
from app.api.ai_routes import router as ai_router
from app.api.websocket_routes import router as websocket_router
from app.api.resource_routes import router as resource_router
# FIXED: Imported the alert router properly
from app.api.alert_routes import router as alert_router 

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hyper-Local Disaster Resilience Network API",
    description="AI-driven real-time disaster prediction and crisis management.",
    version="1.0.0"
)

# --- CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTERS ---
app.include_router(auth_router)
app.include_router(incident_router) 
app.include_router(ai_router)
app.include_router(websocket_router)
app.include_router(resource_router)
# FIXED: Using the imported alias
app.include_router(alert_router) 

from fastapi.staticfiles import StaticFiles

# --- STATIC FILES (IMAGE STORAGE) ---
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"status": "online", "message": "Welcome to the Disaster Resilience Network API"}