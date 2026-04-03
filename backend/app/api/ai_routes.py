from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.core import User
from app.services.ai_service import generate_risk_zones
# Import the centralized security dependencies
from app.api.auth_routes import allow_any_user, allow_admin_only

router = APIRouter(prefix="/ai", tags=["AI & Analytics"])

@router.get("/heatmap-zones")
def get_heatmap_zones(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_any_user) # Change to allow_admin_only for strictness
):
    """
    Triggers the DBSCAN clustering algorithm.
    Only logged-in users can view risk analysis.
    """
    zones = generate_risk_zones(db)
    
    return {
        "status": "success",
        "total_active_zones": len(zones),
        "zones": zones
    }