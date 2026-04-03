import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

# Enums for strict role and status validation
class UserRole(str, enum.Enum):
    citizen = "citizen"
    responder = "responder"
    admin = "admin"
    superadmin = "superadmin"

class IncidentStatus(str, enum.Enum):
    reported = "reported"
    verifying = "verifying"
    active = "active"
    resolved = "resolved"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="citizen")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_latitude = Column(Float, nullable=True)
    last_longitude = Column(Float, nullable=True)

    # Relationships
    incidents = relationship("Incident", back_populates="reporter")

# NEW TABLE: Tracks which user upvoted which incident to prevent spam
class IncidentUpvote(Base):
    __tablename__ = "incident_upvotes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    incident_id = Column(Integer, ForeignKey("incidents.id"))

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    category = Column(String, index=True) # e.g., Fire, Flood, Earthquake
    severity = Column(Integer, nullable=True) # e.g., 1 to 10
    report_count = Column(Integer, default=1)
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(String, nullable=True)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.reported)
    reported_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # NEW COLUMNS FOR VERIFICATION
    upvotes = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)

    # Relationships
    reporter = relationship("User", back_populates="incidents")
    resources = relationship("Resource", back_populates="incident")

class Resource(Base):
    __tablename__ = "resources"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String) # e.g., Ambulance, Fire Truck, Rescue Team
    status = Column(String, default="available") # available, dispatched, busy
    latitude = Column(Float)
    longitude = Column(Float)
    assigned_incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)

    # Relationships
    incident = relationship("Incident", back_populates="resources")


class ZoneRisk(Base):
    __tablename__ = "zone_risks"
    
    id = Column(Integer, primary_key=True, index=True)
    risk_score = Column(Float)
    zone_center_lat = Column(Float)
    zone_center_lng = Column(Float)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    incident_id = Column(Integer, ForeignKey("incidents.id"))
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
    incident = relationship("Incident")