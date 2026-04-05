import math
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.core import Incident, IncidentStatus

def get_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def generate_recommendations(db: Session, lat: float, lng: float) -> List[Dict[str, Any]]:
    # fetch incidents last 48 hours
    two_days_ago = datetime.utcnow() - timedelta(days=2)
    incidents = db.query(Incident).filter(
        Incident.created_at >= two_days_ago,
        Incident.status != IncidentStatus.resolved
    ).all()
    
    # filter 10km radius
    nearby = [inc for inc in incidents if inc.latitude is not None and inc.longitude is not None and get_distance_km(lat, lng, inc.latitude, inc.longitude) <= 10]
    
    # clustering logic
    clusters = {}
    for inc in nearby:
        cat = inc.category or "UNKNOWN"
        if cat not in clusters:
            clusters[cat] = []
        clusters[cat].append(inc)
    
    recommendations = []
    for cat, incs in clusters.items():
        count = len(incs)
        severity_list = [inc.severity for inc in incs if inc.severity is not None]
        max_severity = max(severity_list) if severity_list else 1
        
        # logic constraints: count > 3 or high severity = more urgent
        if count >= 3 or max_severity >= 8:
            urgency = "High"
            rec_type = "EVACUATION"
        elif count >= 2 or max_severity >= 4:
            urgency = "Medium"
            rec_type = "PRECAUTION"
        else:
            urgency = "Low"
            rec_type = "ROUTE_ADVICE"
        
        rec = {
            "type": rec_type,
            "title": f"Multiple {cat} alerts" if count > 1 else f"{cat} Alert",
            "category": cat,
            "severity": urgency
        }
        
        cat_lower = cat.lower()
        if cat_lower == "fire":
            rec["recommendation"] = f"There are {count} active fire reports nearby. Stay indoors and avoid major smoke zones." if urgency != "High" else "Critical fire conditions. Evacuate immediately if instructed by local authorities."
        elif cat_lower == "flood":
             rec["recommendation"] = f"Heavy flooding reported in {count} locations. Avoid low-lying bridge routes and move to floor 2 or higher."
        elif cat_lower == "chemical":
             rec["recommendation"] = f"Chemical hazard detected. Stay indoors, close all windows, and turn off HVAC systems."
        elif "earthquake" in cat_lower:
             rec["recommendation"] = f"Seismic activity detected. Check building structure and avoid standing near unsupported walls."
        elif "medical" in cat_lower:
             rec["recommendation"] = f"Medical emergencies reported near you. Keep access roads clear for ambulances."
        else:
             if urgency == "High":
                 rec["recommendation"] = f"There are {count} critical reports of {cat} nearby. Avoid the area entirely and seek shelter."
             else:
                 rec["recommendation"] = f"There are {count} reports of {cat} nearby. Exercise caution and stay alert."
             
        recommendations.append(rec)
        
    # Sort by urgency
    severity_order = {"High": 0, "Medium": 1, "Low": 2}
    return sorted(recommendations, key=lambda x: severity_order.get(x["severity"], 3))
