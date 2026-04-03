from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.core import Resource, Incident, User
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse
from app.api.auth_routes import allow_admin_only, allow_any_user

router = APIRouter(prefix="/resources", tags=["Resource Dispatch"])

@router.post("/", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def add_resource(
    resource: ResourceCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(allow_admin_only) # Strict RBAC: Only Admins can add units
):
    """Adds a new rescue unit (Fire Truck, Ambulance, etc.) to the map."""
    new_resource = Resource(
        type=resource.type,
        latitude=resource.latitude,
        longitude=resource.longitude,
        status="available"
    )
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    return new_resource

@router.get("/", response_model=List[ResourceResponse])
def get_all_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user)
):
    """Allows web and mobile apps to plot available rescue units on the map."""
    return db.query(Resource).all()

@router.post("/{resource_id}/dispatch", response_model=ResourceResponse)
def dispatch_resource(
    resource_id: int,
    incident_id: int, # Pass the ID of the incident the unit is responding to
    db: Session = Depends(get_db),
    admin: User = Depends(allow_admin_only) # Strict RBAC: Only Admins can dispatch
):
    """Assigns an available rescue unit to a specific active incident."""
    # 1. Ensure the resource exists
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    # 2. Ensure the incident exists
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    # 3. Check if the resource is already busy
    if resource.status != "available":
        raise HTTPException(status_code=400, detail=f"Cannot dispatch. Resource is currently {resource.status}")

    # 4. Update the resource status and assign it to the emergency
    resource.status = "dispatched"
    resource.assigned_incident_id = incident.id
    
    db.commit()
    db.refresh(resource)
    
    return resource