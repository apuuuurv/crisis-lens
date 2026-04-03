from pydantic import BaseModel
from datetime import datetime
from app.models.core import IncidentStatus

class IncidentCreate(BaseModel):
    title: str
    description: str
    category: str
    severity: int | None = None
    latitude: float
    longitude: float
    address: str | None = None

class IncidentResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    severity: int | None = None
    report_count: int
    latitude: float
    longitude: float
    address: str | None = None
    status: IncidentStatus
    trust_status: str
    reported_by: int
    created_at: datetime
    
    # NEW FIELDS ADDED HERE
    upvotes: int
    is_verified: bool

    class Config:
        from_attributes = True
