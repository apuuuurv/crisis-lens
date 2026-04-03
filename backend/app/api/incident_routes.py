from fastapi import UploadFile, File, APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
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
async def report_incident(
    incident: IncidentCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_any_user) # Any logged-in user can report
):
    # 1. Deduplication Logic: Check for existing incidents (same category, 500m radius, last 2 hours)
    from datetime import timezone
    time_window = datetime.now(timezone.utc) - timedelta(hours=2)
    nearby_incidents = db.query(Incident).filter(
        Incident.category == incident.category,
        Incident.created_at >= time_window
    ).all()

    match = None
    for ex in nearby_incidents:
        dist = calculate_distance_km(incident.latitude, incident.longitude, ex.latitude, ex.longitude)
        if dist <= 0.5: # 500 meters
            match = ex
            break

    if match:
        match.report_count += 1
        db.commit()
        db.refresh(match)
        
        # Real-time update for existing incident
        broadcast_data = {
            "type": "UPDATE_INCIDENT",
            "data": {
                "id": match.id,
                "report_count": match.report_count
            }
        }
        await manager.broadcast_incident(broadcast_data)
        return match

    # 2. No match found, create new incident
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

    # New Incident Broadcast
    broadcast_data = {
        "type": "NEW_INCIDENT",
        "data": {
            "id": new_incident.id,
            "title": new_incident.title,
            "category": new_incident.category,
            "report_count": new_incident.report_count,
            "latitude": new_incident.latitude,
            "longitude": new_incident.longitude
        }
    }
    await manager.broadcast_incident(broadcast_data)

    return new_incident

    return new_incident

@router.get("/", response_model=List[IncidentResponse])
def get_all_incidents(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user) # Typically anyone can see the map
):
    incidents = db.query(Incident).all()
    return incidents

from fastapi import UploadFile, File, APIRouter, Depends, HTTPException, status, Form

@router.post("/upload", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def report_incident_via_image(
    file: UploadFile = File(...),
    latitude: float = Form(None),
    longitude: float = Form(None),
    title: str = Form(None),
    description: str = Form(None),
    category: str = Form(None),
    severity: int = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user)
):
    image_bytes = await file.read()
    extracted_data = extract_image_data(image_bytes)

    # Use manual inputs if provided, otherwise fallback to AI/EXIF extraction
    final_lat = latitude if latitude is not None else extracted_data["latitude"]
    final_lng = longitude if longitude is not None else extracted_data["longitude"]
    final_title = title if title else extracted_data["title"]
    final_desc = description if description else extracted_data["description"]
    final_cat = category if category else extracted_data["category"]
    final_sev = severity if severity is not None else extracted_data["severity"]

    # 1. Deduplication Logic: Check for existing incidents (same category, 500m radius, last 2 hours)
    from datetime import timezone
    time_window = datetime.now(timezone.utc) - timedelta(hours=2)
    nearby_incidents = db.query(Incident).filter(
        Incident.category == final_cat,
        Incident.created_at >= time_window
    ).all()

    match = None
    for ex in nearby_incidents:
        dist = calculate_distance_km(final_lat, final_lng, ex.latitude, ex.longitude)
        if dist <= 0.5: # 500 meters
            match = ex
            break

    if match:
        match.report_count += 1
        db.commit()
        db.refresh(match)
        
        # Real-time update for existing incident
        broadcast_data = {
            "type": "UPDATE_INCIDENT",
            "data": {
                "id": match.id,
                "report_count": match.report_count
            }
        }
        await manager.broadcast_incident(broadcast_data)
        return match

    # 2. No match found, create new incident
    new_incident = Incident(
        title=final_title,
        description=final_desc,
        category=final_cat,
        severity=final_sev,
        latitude=final_lat,
        longitude=final_lng,
        reported_by=current_user.id
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

    # WebSocket Broadcast for new incident
    broadcast_data = {
        "type": "NEW_INCIDENT",
        "data": {
            "id": new_incident.id,
            "title": new_incident.title,
            "category": new_incident.category,
            "report_count": new_incident.report_count,
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