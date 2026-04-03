from datetime import datetime, timedelta, timezone
import os
from typing import Iterable, List
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.auth_routes import allow_admin_only, allow_any_user
from app.api.websocket_routes import manager
from app.database import get_db
from app.models.core import (
    Alert,
    Incident,
    IncidentStatus,
    IncidentTrustStatus,
    IncidentUpvote,
    ReportSubmission,
    User,
)
from app.schemas.incident import IncidentCreate, IncidentResponse
from app.utils.geo import calculate_distance_km

router = APIRouter(prefix="/incidents", tags=["Incidents"])

DEDUP_RADIUS_KM = 0.5
CONFLICT_RADIUS_KM = 0.5
COOLDOWN_RADIUS_KM = 1.0
COOLDOWN_WINDOW_MINUTES = 30
DANGER_RADIUS_KM = 5.0
CONFLICTING_CATEGORIES = {
    "fire": {"flood"},
    "flood": {"fire"},
}
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


def _check_submission_cooldown(
    db: Session,
    *,
    user_id: int,
    latitude: float,
    longitude: float,
) -> None:
    cooldown_window = datetime.now(timezone.utc) - timedelta(minutes=COOLDOWN_WINDOW_MINUTES)
    recent_submissions = db.query(ReportSubmission).filter(
        ReportSubmission.user_id == user_id,
        ReportSubmission.created_at >= cooldown_window,
    ).all()

    for submission in recent_submissions:
        distance = calculate_distance_km(
            latitude,
            longitude,
            submission.latitude,
            submission.longitude,
        )
        if distance <= COOLDOWN_RADIUS_KM:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="You already submitted a nearby report. Please wait 30 minutes before reporting again in this area.",
            )


def _find_duplicate_incident(
    db: Session,
    *,
    category: str,
    latitude: float,
    longitude: float,
) -> Incident | None:
    time_window = datetime.now(timezone.utc) - timedelta(hours=2)
    nearby_incidents = db.query(Incident).filter(
        Incident.category == category,
        Incident.created_at >= time_window,
    ).all()

    for existing_incident in nearby_incidents:
        distance = calculate_distance_km(
            latitude,
            longitude,
            existing_incident.latitude,
            existing_incident.longitude,
        )
        if distance <= DEDUP_RADIUS_KM:
            return existing_incident
    return None


def _apply_conflict_review(
    db: Session,
    *,
    subject_incident: Incident,
) -> List[Incident]:
    conflicting_categories = CONFLICTING_CATEGORIES.get(subject_incident.category.lower(), set())
    if not conflicting_categories:
        return []

    active_incidents = db.query(Incident).filter(
        Incident.id != subject_incident.id,
        Incident.status == IncidentStatus.active,
    ).all()

    flagged_incidents: List[Incident] = []
    for existing_incident in active_incidents:
        if existing_incident.category.lower() not in conflicting_categories:
            continue

        distance = calculate_distance_km(
            subject_incident.latitude,
            subject_incident.longitude,
            existing_incident.latitude,
            existing_incident.longitude,
        )
        if distance > CONFLICT_RADIUS_KM:
            continue

        for incident in (subject_incident, existing_incident):
            incident.trust_status = IncidentTrustStatus.suspicious.value
            incident.status = IncidentStatus.verifying
            incident.is_verified = False
            if incident not in flagged_incidents:
                flagged_incidents.append(incident)

    return flagged_incidents


def _create_geofence_alerts(db: Session, incident: Incident) -> None:
    all_users = db.query(User).all()
    alerts_to_create = []

    for user in all_users:
        if user.last_latitude is None or user.last_longitude is None:
            continue

        distance = calculate_distance_km(
            incident.latitude,
            incident.longitude,
            user.last_latitude,
            user.last_longitude,
        )
        if distance <= DANGER_RADIUS_KM:
            alerts_to_create.append(
                Alert(
                    user_id=user.id,
                    incident_id=incident.id,
                    message=f"DANGER: A {incident.category} has been reported {round(distance, 1)}km away from you. Stay safe!",
                )
            )

    if alerts_to_create:
        db.bulk_save_objects(alerts_to_create)


def _record_submission(
    db: Session,
    *,
    user_id: int,
    incident_id: int,
    latitude: float,
    longitude: float,
) -> None:
    db.add(
        ReportSubmission(
            user_id=user_id,
            incident_id=incident_id,
            latitude=latitude,
            longitude=longitude,
        )
    )


async def _broadcast_incident_update(incident: Incident) -> None:
    await manager.broadcast_incident(
        {
            "type": "UPDATE_INCIDENT",
            "data": {
                "id": incident.id,
                "report_count": incident.report_count,
                "status": incident.status.value if hasattr(incident.status, "value") else incident.status,
                "trust_status": incident.trust_status,
                "is_verified": incident.is_verified,
            },
        }
    )


async def _broadcast_flagged_incidents(flagged_incidents: Iterable[Incident]) -> None:
    for incident in flagged_incidents:
        await _broadcast_incident_update(incident)


async def _process_incident_submission(
    db: Session,
    *,
    title: str,
    description: str,
    category: str,
    severity: int | None,
    latitude: float,
    longitude: float,
    address: str | None,
    current_user: User,
) -> Incident:
    _check_submission_cooldown(
        db,
        user_id=current_user.id,
        latitude=latitude,
        longitude=longitude,
    )

    matched_incident = _find_duplicate_incident(
        db,
        category=category,
        latitude=latitude,
        longitude=longitude,
    )

    if matched_incident:
        matched_incident.report_count += 1
        _record_submission(
            db,
            user_id=current_user.id,
            incident_id=matched_incident.id,
            latitude=latitude,
            longitude=longitude,
        )
        flagged_incidents = _apply_conflict_review(db, subject_incident=matched_incident)
        db.commit()
        db.refresh(matched_incident)
        await _broadcast_incident_update(matched_incident)
        if flagged_incidents:
            for incident in flagged_incidents:
                db.refresh(incident)
            await _broadcast_flagged_incidents(flagged_incidents)
        return matched_incident

    new_incident = Incident(
        title=title,
        description=description,
        category=category,
        severity=severity,
        latitude=latitude,
        longitude=longitude,
        address=address,
        reported_by=current_user.id,
    )
    db.add(new_incident)
    db.flush()

    _record_submission(
        db,
        user_id=current_user.id,
        incident_id=new_incident.id,
        latitude=latitude,
        longitude=longitude,
    )
    _create_geofence_alerts(db, new_incident)
    flagged_incidents = _apply_conflict_review(db, subject_incident=new_incident)

    db.commit()
    db.refresh(new_incident)

    await manager.broadcast_incident(
        {
            "type": "NEW_INCIDENT",
            "data": {
                "id": new_incident.id,
                "title": new_incident.title,
                "category": new_incident.category,
                "report_count": new_incident.report_count,
                "latitude": new_incident.latitude,
                "longitude": new_incident.longitude,
                "status": new_incident.status.value if hasattr(new_incident.status, "value") else new_incident.status,
                "trust_status": new_incident.trust_status,
            },
        }
    )
    if flagged_incidents:
        for incident in flagged_incidents:
            db.refresh(incident)
        await _broadcast_flagged_incidents(flagged_incidents)

    return new_incident


@router.post("/", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def report_incident(
    incident: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user),
):
    return await _process_incident_submission(
        db,
        title=incident.title,
        description=incident.description,
        category=incident.category,
        severity=incident.severity,
        latitude=incident.latitude,
        longitude=incident.longitude,
        address=incident.address,
        current_user=current_user,
    )


@router.get("/", response_model=List[IncidentResponse])
def get_all_incidents(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user),
):
    return db.query(Incident).all()


@router.post("/upload", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def report_incident_via_image(
    file: UploadFile = File(...),
    latitude: float = Form(None),
    longitude: float = Form(None),
    title: str = Form(None),
    description: str = Form(None),
    category: str = Form(None),
    severity: int = Form(None),
    address: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user),
):
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image file is required.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    _, file_extension = os.path.splitext(file.filename or "")
    saved_filename = f"{uuid4().hex}{file_extension or '.jpg'}"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as upload_file:
        upload_file.write(image_bytes)

    final_lat = latitude if latitude is not None else 19.0760
    final_lng = longitude if longitude is not None else 72.8777
    final_title = title if title else "Image-based Incident Report"
    confidence_score = 100
    trust_status = "Verified"
    final_desc = description if description else f"Citizen-submitted image saved for manual review. Confidence: {confidence_score}. Trust: {trust_status}. File: {saved_filename}"
    final_cat = category if category else "Other"
    final_sev = severity if severity is not None else 5
    final_address = address if address else None

    incident = await _process_incident_submission(
        db,
        title=final_title,
        description=final_desc,
        category=final_cat,
        severity=final_sev,
        latitude=final_lat,
        longitude=final_lng,
        address=final_address,
        current_user=current_user,
    )
    incident.trust_status = trust_status
    incident.is_verified = True
    db.commit()
    db.refresh(incident)
    return incident


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(allow_admin_only),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    db.delete(incident)
    db.commit()
    return None


@router.post("/{incident_id}/upvote", response_model=IncidentResponse)
def upvote_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    existing_vote = db.query(IncidentUpvote).filter(
        IncidentUpvote.incident_id == incident_id,
        IncidentUpvote.user_id == current_user.id,
    ).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already verified this incident")

    db.add(IncidentUpvote(user_id=current_user.id, incident_id=incident_id))
    incident.upvotes += 1

    if incident.upvotes >= 3:
        incident.is_verified = True

    db.commit()
    db.refresh(incident)
    return incident
