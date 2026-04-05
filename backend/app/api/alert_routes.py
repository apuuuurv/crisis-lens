from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.database import get_db
from app.models.core import User, Alert
from app.api.auth_routes import allow_any_user

router = APIRouter(prefix="/alerts", tags=["Geofenced Alerts"])

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

@router.put("/my-location")
def update_user_location(
    location: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user)
):
    """Mobile app will ping this every few minutes to update the user's GPS location."""
    current_user.last_latitude = location.latitude
    current_user.last_longitude = location.longitude
    db.commit()
    return {"message": "Location updated successfully"}

@router.get("/")
def get_my_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user)
):
    """Fetches all danger alerts sent to this specific user."""
    alerts = db.query(Alert).filter(Alert.user_id == current_user.id).order_by(Alert.created_at.desc()).all()
    return alerts

from app.services.recommendation_service import generate_recommendations

@router.get("/recommendations")
def get_recommendations(
    lat: float,
    lng: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user)
):
    """Fetches localized safety recommendations based on current incidents."""
    return generate_recommendations(db, lat, lng)