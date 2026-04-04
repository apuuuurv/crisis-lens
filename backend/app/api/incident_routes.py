from datetime import datetime, timedelta, timezone
import logging
import os
from typing import Iterable, List
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile, status
from fastapi.responses import FileResponse
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
    ResolutionRequest,
    ReportSubmission,
    User,
)
from app.schemas.incident import (
    AdminResolutionFeedbackResponse,
    IncidentCreate,
    IncidentReportDetail,
    IncidentReportHistoryResponse,
    PendingResolutionRequestResponse,
    ResolutionRequestAction,
    ResolutionRequestActionResponse,
    IncidentResponse,
)
from app.services.ai_service import AIValidationError, ai_validation_service
from app.utils.geo import calculate_distance_km

router = APIRouter(prefix="/incidents", tags=["Incidents"])
logger = logging.getLogger(__name__)

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
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024


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
        Incident.status != IncidentStatus.resolved,
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
    image_filename: str | None = None,
    image_content_type: str | None = None,
    image_data: bytes | None = None,
) -> None:
    db.add(
        ReportSubmission(
            user_id=user_id,
            incident_id=incident_id,
            latitude=latitude,
            longitude=longitude,
            image_filename=image_filename,
            image_content_type=image_content_type,
            image_data=image_data,
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


async def _broadcast_resolution_event(event_type: str, data: dict) -> None:
    await manager.broadcast_incident(
        {
            "type": event_type,
            "data": data,
        }
    )


def _release_incident_resources(incident: Incident) -> None:
    for resource in incident.resources:
        resource.status = "available"
        resource.assigned_incident_id = None


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
    evidence_filename: str | None = None,
    evidence_content_type: str | None = None,
    evidence_bytes: bytes | None = None,
    ai_label: str | None = None,
    ai_confidence: float | None = None,
    is_suspicious: bool = False,
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
        matched_incident.updated_at = datetime.now(timezone.utc)
        if evidence_filename:
            existing_description = (matched_incident.description or "").strip()
            evidence_note = f"Additional image evidence received. File: {evidence_filename}"
            if evidence_filename not in existing_description:
                matched_incident.description = (
                    f"{existing_description}\n{evidence_note}".strip()
                    if existing_description
                    else evidence_note
                )
            matched_incident.is_verified = True
            matched_incident.trust_status = "Verified"
            matched_incident.image_filename = evidence_filename
            matched_incident.image_content_type = evidence_content_type
            matched_incident.image_data = evidence_bytes
        if ai_label is not None:
            matched_incident.ai_label = ai_label
            matched_incident.ai_confidence = ai_confidence
            matched_incident.is_suspicious = is_suspicious
            if is_suspicious:
                matched_incident.trust_status = IncidentTrustStatus.suspicious.value
                matched_incident.is_verified = False
        _record_submission(
            db,
            user_id=current_user.id,
            incident_id=matched_incident.id,
            latitude=latitude,
            longitude=longitude,
            image_filename=evidence_filename,
            image_content_type=evidence_content_type,
            image_data=evidence_bytes,
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
        ai_label=ai_label,
        ai_confidence=ai_confidence,
        is_suspicious=is_suspicious,
        image_filename=evidence_filename,
        image_content_type=evidence_content_type,
        image_data=evidence_bytes,
    )
    db.add(new_incident)
    db.flush()

    _record_submission(
        db,
        user_id=current_user.id,
        incident_id=new_incident.id,
        latitude=latitude,
        longitude=longitude,
        image_filename=evidence_filename,
        image_content_type=evidence_content_type,
        image_data=evidence_bytes,
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
    include_resolved: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user),
):
    query = db.query(Incident)
    if not include_resolved:
        query = query.filter(Incident.status != IncidentStatus.resolved)
    return query.order_by(Incident.updated_at.desc(), Incident.created_at.desc()).all()


@router.get("/my-reports", response_model=List[IncidentResponse])
def get_my_reported_incidents(
    include_resolved: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user),
):
    submission_incident_ids = (
        db.query(ReportSubmission.incident_id)
        .filter(
            ReportSubmission.user_id == current_user.id,
            ReportSubmission.incident_id.isnot(None),
        )
        .distinct()
        .subquery()
    )

    query = (
        db.query(Incident)
        .filter(Incident.id.in_(submission_incident_ids))
        .order_by(Incident.updated_at.desc(), Incident.created_at.desc())
    )
    if not include_resolved:
        query = query.filter(Incident.status != IncidentStatus.resolved)
    return query.all()


@router.post("/{incident_id}/request-resolution")
async def request_incident_resolution(
    incident_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(allow_admin_only),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if incident.status == IncidentStatus.resolved:
        raise HTTPException(status_code=400, detail="Incident is already resolved")

    distinct_user_rows = (
        db.query(ReportSubmission.user_id)
        .filter(ReportSubmission.incident_id == incident_id)
        .distinct()
        .all()
    )
    reporter_ids = [row[0] for row in distinct_user_rows if row[0] is not None]
    if not reporter_ids and incident.reported_by:
        reporter_ids = [incident.reported_by]

    if not reporter_ids:
        raise HTTPException(status_code=400, detail="No reporting users found for this incident")

    pending_requests = db.query(ResolutionRequest).filter(
        ResolutionRequest.incident_id == incident_id,
        ResolutionRequest.status == "pending",
    ).all()
    for request in pending_requests:
        request.status = "cancelled"
        request.responded_at = datetime.now(timezone.utc)
        request.response_message = "Superseded by a newer resolution confirmation request."

    requests = []
    alerts = []
    for reporter_id in reporter_ids:
        request = ResolutionRequest(
            incident_id=incident.id,
            user_id=reporter_id,
            requested_by_admin_id=admin.id,
            status="pending",
        )
        requests.append(request)
        alerts.append(
            Alert(
                user_id=reporter_id,
                incident_id=incident.id,
                message=f"Admin requested confirmation for '{incident.title}'. Please confirm whether the issue is actually resolved.",
            )
        )

    db.add_all(requests)
    if alerts:
        db.add_all(alerts)
    db.commit()

    await _broadcast_resolution_event(
        "RESOLUTION_REQUESTED",
        {"incident_id": incident.id, "reporter_count": len(reporter_ids)},
    )

    return {
        "incident_id": incident.id,
        "requested_from": len(reporter_ids),
        "message": "Resolution confirmation requested from reporting users.",
    }


@router.get("/pending-resolution-requests", response_model=List[PendingResolutionRequestResponse])
def get_pending_resolution_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user),
):
    requests = (
        db.query(ResolutionRequest, Incident, User)
        .join(Incident, Incident.id == ResolutionRequest.incident_id)
        .join(User, User.id == ResolutionRequest.requested_by_admin_id)
        .filter(
            ResolutionRequest.user_id == current_user.id,
            ResolutionRequest.status == "pending",
            Incident.status != IncidentStatus.resolved,
        )
        .order_by(ResolutionRequest.created_at.desc())
        .all()
    )

    return [
        PendingResolutionRequestResponse(
            request_id=request.id,
            incident_id=incident.id,
            incident_title=incident.title,
            category=incident.category,
            requested_at=request.created_at,
            requested_by_admin_name=admin.name,
            requested_by_admin_email=admin.email,
        )
        for request, incident, admin in requests
    ]


@router.post("/resolution-requests/{request_id}/respond", response_model=ResolutionRequestActionResponse)
async def respond_to_resolution_request(
    request_id: int,
    payload: ResolutionRequestAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user),
):
    request = (
        db.query(ResolutionRequest)
        .filter(ResolutionRequest.id == request_id, ResolutionRequest.user_id == current_user.id)
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Resolution request not found")
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Resolution request has already been handled")

    incident = db.query(Incident).filter(Incident.id == request.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.now(timezone.utc)
    request.responded_at = now
    request.response_message = payload.message

    sibling_pending_requests = db.query(ResolutionRequest).filter(
        ResolutionRequest.incident_id == incident.id,
        ResolutionRequest.status == "pending",
        ResolutionRequest.id != request.id,
    ).all()

    admin_users = db.query(User).filter(User.role.in_(["admin", "superadmin"])).all()

    if payload.resolved:
        request.status = "confirmed"
        incident.status = IncidentStatus.resolved
        incident.trust_status = IncidentTrustStatus.trusted.value
        _release_incident_resources(incident)
        for sibling in sibling_pending_requests:
            sibling.status = "cancelled"
            sibling.responded_at = now
            sibling.response_message = "Closed after another reporter confirmed the issue was resolved."
        for admin in admin_users:
            db.add(
                Alert(
                    user_id=admin.id,
                    incident_id=incident.id,
                    message=f"{current_user.name} confirmed that '{incident.title}' is resolved.",
                )
            )
        response_status = "confirmed"
    else:
        request.status = "rejected"
        incident.status = IncidentStatus.verifying
        incident.trust_status = IncidentTrustStatus.under_review.value
        for sibling in sibling_pending_requests:
            sibling.status = "cancelled"
            sibling.responded_at = now
            sibling.response_message = "Closed because another reporter said the issue is still active."
        follow_up_message = payload.message or "Reporter says the issue is still active."
        for admin in admin_users:
            db.add(
                Alert(
                    user_id=admin.id,
                    incident_id=incident.id,
                    message=f"{current_user.name} says '{incident.title}' is not resolved. Follow-up: {follow_up_message}",
                )
            )
        response_status = "rejected"

    db.commit()
    db.refresh(request)
    db.refresh(incident)

    await _broadcast_incident_update(incident)
    await _broadcast_resolution_event(
        "RESOLUTION_RESPONSE",
        {"incident_id": incident.id, "request_id": request.id, "status": response_status},
    )

    return ResolutionRequestActionResponse(
        request_id=request.id,
        incident_id=incident.id,
        status=request.status,
        response_message=request.response_message,
    )


@router.get("/admin-resolution-feedback", response_model=List[AdminResolutionFeedbackResponse])
def get_admin_resolution_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin_only),
):
    feedback_rows = (
        db.query(ResolutionRequest, Incident, User)
        .join(Incident, Incident.id == ResolutionRequest.incident_id)
        .join(User, User.id == ResolutionRequest.user_id)
        .filter(ResolutionRequest.status == "rejected")
        .order_by(ResolutionRequest.responded_at.desc(), ResolutionRequest.created_at.desc())
        .all()
    )

    return [
        AdminResolutionFeedbackResponse(
            request_id=request.id,
            incident_id=incident.id,
            incident_title=incident.title,
            category=incident.category,
            user_name=user.name,
            user_email=user.email,
            status=request.status,
            response_message=request.response_message,
            created_at=request.created_at,
            responded_at=request.responded_at,
        )
        for request, incident, user in feedback_rows
    ]


@router.get("/{incident_id}/reports", response_model=IncidentReportHistoryResponse)
def get_incident_reports(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin_only),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    submissions = (
        db.query(ReportSubmission, User)
        .join(User, User.id == ReportSubmission.user_id)
        .filter(ReportSubmission.incident_id == incident_id)
        .order_by(ReportSubmission.created_at.desc(), ReportSubmission.id.desc())
        .all()
    )

    reports = [
        IncidentReportDetail(
            id=submission.id,
            user_id=user.id,
            user_name=user.name,
            user_email=user.email,
            created_at=submission.created_at,
            latitude=submission.latitude,
            longitude=submission.longitude,
            image_filename=submission.image_filename,
            image_content_type=submission.image_content_type,
        )
        for submission, user in submissions
    ]

    return IncidentReportHistoryResponse(
        incident_id=incident.id,
        incident_title=incident.title,
        reports=reports,
    )


@router.get("/{incident_id}/image")
def get_incident_image(
    incident_id: int,
    db: Session = Depends(get_db),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if incident.image_data:
        return Response(
            content=incident.image_data,
            media_type=incident.image_content_type or "application/octet-stream",
            headers={"Cache-Control": "no-store"},
        )

    if incident.image_filename:
        saved_path = os.path.join(UPLOAD_DIR, incident.image_filename)
        if os.path.exists(saved_path):
            return FileResponse(
                saved_path,
                media_type=incident.image_content_type or "application/octet-stream",
                filename=incident.image_filename,
            )

    raise HTTPException(status_code=404, detail="Incident image not found")


@router.get("/report-submissions/{report_id}/image")
def get_report_submission_image(
    report_id: int,
    db: Session = Depends(get_db),
):
    submission = db.query(ReportSubmission).filter(ReportSubmission.id == report_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Report submission not found")

    if submission.image_data:
        return Response(
            content=submission.image_data,
            media_type=submission.image_content_type or "application/octet-stream",
            headers={"Cache-Control": "no-store"},
        )

    if submission.image_filename:
        saved_path = os.path.join(UPLOAD_DIR, submission.image_filename)
        if os.path.exists(saved_path):
            return FileResponse(
                saved_path,
                media_type=submission.image_content_type or "application/octet-stream",
                filename=submission.image_filename,
            )

    raise HTTPException(status_code=404, detail="Report image not found")


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
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image file is required.")
        if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Uploaded image exceeds the 10MB size limit.",
            )
        if file.content_type and not file.content_type.startswith("image/"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file must be an image.")

        final_lat = latitude if latitude is not None else 19.0760
        final_lng = longitude if longitude is not None else 72.8777
        final_title = title if title else "Image-based Incident Report"
        final_cat = category if category else "Other"

        os.makedirs(UPLOAD_DIR, exist_ok=True)
        _, file_extension = os.path.splitext(file.filename or "")
        saved_filename = f"{uuid4().hex}{file_extension or '.jpg'}"
        saved_path = os.path.join(UPLOAD_DIR, saved_filename)

        try:
            ai_result = ai_validation_service.validate_image(image_bytes, expected_category=final_cat)
        except AIValidationError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
        except Exception as exc:
            logger.exception("Unexpected AI validation failure during image upload")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI validation failed: {exc}",
            ) from exc

        ai_label = ai_result["label"]
        ai_confidence = ai_result["confidence"]
        is_suspicious = ai_result["is_suspicious"]
        is_valid_for_category = ai_result.get("is_valid_for_category", True)
        validation_message = ai_result.get("validation_message")
        if not is_valid_for_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=validation_message or f"No valid image found for the selected {final_cat} disaster.",
            )
        trust_status = IncidentTrustStatus.suspicious.value if is_suspicious else "Verified"
        confidence_percentage = round(ai_confidence * 100, 2)
        final_desc = description if description else (
            f"Citizen-submitted image analyzed by CLIP. "
            f"Predicted: {ai_label}. Confidence: {confidence_percentage}. Trust: {trust_status}. File: {saved_filename}"
        )
        final_sev = severity if severity is not None else 5
        final_address = address if address else None

        with open(saved_path, "wb") as upload_file:
            upload_file.write(image_bytes)

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
            evidence_filename=saved_filename,
            evidence_content_type=file.content_type,
            evidence_bytes=image_bytes,
            ai_label=ai_label,
            ai_confidence=ai_confidence,
            is_suspicious=is_suspicious,
        )
        incident.trust_status = trust_status
        incident.is_verified = not is_suspicious
        incident.ai_label = ai_label
        incident.ai_confidence = ai_confidence
        incident.is_suspicious = is_suspicious
        db.commit()
        db.refresh(incident)
        return incident
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unhandled error during image-based incident upload")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image upload failed: {exc}",
        ) from exc


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


@router.post("/{incident_id}/resolve", response_model=IncidentResponse)
async def resolve_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(allow_admin_only),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = IncidentStatus.resolved

    for resource in incident.resources:
        resource.status = "available"
        resource.assigned_incident_id = None

    db.commit()
    db.refresh(incident)

    await _broadcast_incident_update(incident)

    return incident
