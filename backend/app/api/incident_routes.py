import os
import uuid
from fastapi import UploadFile, File, Form, APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.websocket_routes import manager
from app.database import get_db
# Imported the new IncidentUpvote and Alert models
from app.models.core import Incident, User, IncidentUpvote, Alert
from app.schemas.incident import IncidentCreate, IncidentResponse
from app.utils.extractor import extract_image_data
# Import the centralized security dependencies
from app.api.auth_routes import get_current_user, allow_admin_only, allow_any_user
# Import the geofence math utility
from app.utils.geo import calculate_distance_km

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.post("/", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def report_incident(
    incident: IncidentCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_any_user) # Any logged-in user can report
):
    new_incident = Incident(
        title=incident.title,
        description=incident.description,
        category=incident.category,
        severity=incident.severity,
        latitude=incident.latitude,
        longitude=incident.longitude,
        reported_by=current_user.id 
    )
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    # --- GEOFENCE ALERT LOGIC ---
    DANGER_RADIUS_KM = 5.0 # Warn anyone within 5 kilometers

    all_users = db.query(User).all()
    alerts_to_create = []

    for user in all_users:
        # Only calculate if the user has shared their location
        if user.last_latitude is not None and user.last_longitude is not None:
            distance = calculate_distance_km(
                new_incident.latitude, new_incident.longitude,
                user.last_latitude, user.last_longitude
            )
            
            if distance <= DANGER_RADIUS_KM:
                new_alert = Alert(
                    user_id=user.id,
                    incident_id=new_incident.id,
                    message=f"DANGER: A {new_incident.category} has been reported {round(distance, 1)}km away from you. Stay safe!"
                )
                alerts_to_create.append(new_alert)

    if alerts_to_create:
        db.bulk_save_objects(alerts_to_create)
        db.commit()
    # -----------------------------

    return new_incident

@router.get("/", response_model=List[IncidentResponse])
def get_all_incidents(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user) # Typically anyone can see the map
):
    incidents = db.query(Incident).all()
    return incidents

@router.post("/upload", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def report_incident_via_image(
    file: UploadFile = File(...),
    latitude: float = Form(None),
    longitude: float = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user)
):
    # --- TASK 1: PERSISTENCE (File Saving) ---
    file_bytes = await file.read()
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    upload_path = os.path.join("uploads", unique_filename)
    
    with open(upload_path, "wb") as f:
        f.write(file_bytes)
    # -----------------------------------------

    # --- TASK 2: VALIDATION (Genuine Logic) --
    extracted_data = extract_image_data(file_bytes, user_lat=latitude, user_lng=longitude)

    new_incident = Incident(
        title=extracted_data["title"],
        description=extracted_data["description"],
        category=extracted_data["category"],
        severity=extracted_data["severity"],
        latitude=extracted_data["latitude"],
        longitude=extracted_data["longitude"],
        reported_by=current_user.id,
        image_url=unique_filename, # Store the filename for frontend access
        trust_score=extracted_data["trust_score"],
        verification_notes=extracted_data["verification_notes"],
        is_verified=extracted_data["trust_score"] >= 0.8 # Auto-verify if trust is high
    )

    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    # --- GEOFENCE ALERT LOGIC ---
    DANGER_RADIUS_KM = 5.0

    all_users = db.query(User).all()
    alerts_to_create = []

    for user in all_users:
        if user.last_latitude is not None and user.last_longitude is not None:
            distance = calculate_distance_km(
                new_incident.latitude, new_incident.longitude,
                user.last_latitude, user.last_longitude
            )
            
            if distance <= DANGER_RADIUS_KM:
                new_alert = Alert(
                    user_id=user.id,
                    incident_id=new_incident.id,
                    message=f"DANGER: A {new_incident.category} has been reported {round(distance, 1)}km away from you. Stay safe!"
                )
                alerts_to_create.append(new_alert)

    if alerts_to_create:
        db.bulk_save_objects(alerts_to_create)
        db.commit()
    # -----------------------------

    # WebSocket Broadcast
    broadcast_data = {
        "type": "NEW_INCIDENT",
        "data": {
            "id": new_incident.id,
            "title": new_incident.title,
            "category": new_incident.category,
            "severity": new_incident.severity,
            "latitude": new_incident.latitude,
            "longitude": new_incident.longitude
        }
    }
    await manager.broadcast_incident(broadcast_data)

    return new_incident

# Admin-only endpoint to delete a false report
@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: int, 
    db: Session = Depends(get_db),
    admin: User = Depends(allow_admin_only) # Restricted to Admins
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    db.delete(incident)
    db.commit()
    return None

# Community Verification (Upvote) Route
@router.post("/{incident_id}/upvote", response_model=IncidentResponse)
def upvote_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user)
):
    # 1. Check if the incident exists
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # 2. Check if the user already upvoted this incident
    existing_vote = db.query(IncidentUpvote).filter(
        IncidentUpvote.incident_id == incident_id,
        IncidentUpvote.user_id == current_user.id
    ).first()

    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already verified this incident")

    # 3. Record the upvote to prevent spam
    new_vote = IncidentUpvote(user_id=current_user.id, incident_id=incident_id)
    db.add(new_vote)

    # 4. Increment the upvote count
    incident.upvotes += 1

    # 5. Community Verification Logic (e.g., if 3 people upvote, it's officially verified)
    if incident.upvotes >= 3:
        incident.is_verified = True

    db.commit()
    db.refresh(incident)

    return incident