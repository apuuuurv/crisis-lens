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


class IncidentReportDetail(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    created_at: datetime
    latitude: float
    longitude: float
    image_filename: str | None = None


class IncidentReportHistoryResponse(BaseModel):
    incident_id: int
    incident_title: str
    reports: list[IncidentReportDetail]


class PendingResolutionRequestResponse(BaseModel):
    request_id: int
    incident_id: int
    incident_title: str
    category: str
    requested_at: datetime
    requested_by_admin_name: str
    requested_by_admin_email: str


class ResolutionRequestAction(BaseModel):
    resolved: bool
    message: str | None = None


class ResolutionRequestActionResponse(BaseModel):
    request_id: int
    incident_id: int
    status: str
    response_message: str | None = None


class AdminResolutionFeedbackResponse(BaseModel):
    request_id: int
    incident_id: int
    incident_title: str
    category: str
    user_name: str
    user_email: str
    status: str
    response_message: str | None = None
    created_at: datetime
    responded_at: datetime | None = None
