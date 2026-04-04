from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from pathlib import Path
import mimetypes

from app.database import engine, Base
from app.models import core
from app.api.auth_routes import router as auth_router
from app.api.incident_routes import router as incident_router 
from app.api.ai_routes import router as ai_router
from app.api.websocket_routes import router as websocket_router
from app.api.resource_routes import router as resource_router
# FIXED: Imported the alert router properly
from app.api.alert_routes import router as alert_router 


def ensure_schema_updates() -> None:
    inspector = inspect(engine)
    if "incidents" in inspector.get_table_names():
        incident_columns = {column["name"] for column in inspector.get_columns("incidents")}
        with engine.begin() as connection:
            if "trust_status" not in incident_columns:
                connection.execute(
                    text("ALTER TABLE incidents ADD COLUMN trust_status VARCHAR DEFAULT 'Trusted'")
                )
            connection.execute(
                text("UPDATE incidents SET trust_status = 'Trusted' WHERE trust_status IS NULL")
            )
    if "report_submissions" in inspector.get_table_names():
        report_submission_columns = {column["name"] for column in inspector.get_columns("report_submissions")}
        with engine.begin() as connection:
            if "image_filename" not in report_submission_columns:
                connection.execute(
                    text("ALTER TABLE report_submissions ADD COLUMN image_filename VARCHAR")
                )

Base.metadata.create_all(bind=engine)
ensure_schema_updates()

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

mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/jpeg", ".jpeg")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/png", ".png")

uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/")
def read_root():
    return {"status": "online", "message": "Welcome to the Disaster Resilience Network API"}
