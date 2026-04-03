import numpy as np
from sklearn.cluster import DBSCAN
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.core import Incident, ZoneRisk, IncidentStatus

def calculate_zone_risk(incidents: list) -> float:
    """
    Implements the Dynamic Risk Scoring Formula.
    Risk Score = (Report Count × 0.3) + (Severity Weight × 0.4) + (Location Density × 0.2) + (Time Spike × 0.1)
    """
    if not incidents:
        return 0.0

    report_count = len(incidents)
    
    # Calculate average severity
    avg_severity = sum(inc.severity for inc in incidents) / report_count
    
    # Location Density (mocked based on report count in the cluster for now)
    location_density = min(report_count * 10, 100) # Caps at 100
    
    # Time Spike: Check how many incidents occurred in the last hour
    now = datetime.utcnow() # <-- FIX: Changed to utcnow() to match SQLite's naive datetime
    recent_incidents = sum(1 for inc in incidents if inc.created_at and (now - inc.created_at).total_seconds() < 3600)
    time_spike = (recent_incidents / report_count) * 100 if report_count > 0 else 0

    # Apply Formula
    risk_score = (report_count * 0.3) + (avg_severity * 0.4) + (location_density * 0.2) + (time_spike * 0.1)
    
    # Normalize score out of 100
    return min(round(risk_score, 2), 100.0)

def generate_risk_zones(db: Session):
    """
    Uses DBSCAN to cluster nearby incidents and calculates risk for each zone.
    """
    # 1. Fetch only active incidents
    active_incidents = db.query(Incident).filter(Incident.status != IncidentStatus.resolved).all()
    
    if len(active_incidents) < 2:
        return [] # Not enough data to cluster

    # 2. Extract Coordinates for ML
    coords = np.array([[inc.latitude, inc.longitude] for inc in active_incidents])

    # 3. Apply DBSCAN Clustering
    # eps=0.05 is roughly 5km distance. min_samples=2 means at least 2 reports make a zone.
    clustering = DBSCAN(eps=0.05, min_samples=2).fit(coords)
    labels = clustering.labels_

    zones_data = []
    
    # 4. Process each cluster (ignore label -1, which means noise/isolated incidents)
    unique_labels = set(labels)
    for label in unique_labels:
        if label == -1:
            continue
            
        # Get all incidents belonging to this cluster
        cluster_indices = np.where(labels == label)[0]
        cluster_incidents = [active_incidents[i] for i in cluster_indices]
        
        # Calculate center point of the zone
        center_lat = sum(inc.latitude for inc in cluster_incidents) / len(cluster_incidents)
        center_lng = sum(inc.longitude for inc in cluster_incidents) / len(cluster_incidents)
        
        # Calculate Risk Score
        risk_score = calculate_zone_risk(cluster_incidents)
        
        zones_data.append({
            "zone_center_lat": center_lat,
            "zone_center_lng": center_lng,
            "risk_score": risk_score,
            "incident_count": len(cluster_incidents)
        })

    return zones_data