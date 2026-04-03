from pydantic import BaseModel
from typing import Optional

class ResourceCreate(BaseModel):
    type: str  # e.g., "Ambulance", "Fire Truck", "Rescue Boat"
    latitude: float
    longitude: float

class ResourceUpdate(BaseModel):
    status: Optional[str] = None # e.g., "available", "dispatched", "busy"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ResourceResponse(BaseModel):
    id: int
    type: str
    status: str
    latitude: float
    longitude: float
    assigned_incident_id: Optional[int] = None

    class Config:
        from_attributes = True