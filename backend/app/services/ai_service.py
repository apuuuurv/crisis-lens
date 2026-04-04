import io
import logging
from datetime import datetime

import numpy as np
from PIL import Image, UnidentifiedImageError
from sklearn.cluster import DBSCAN
from sqlalchemy.orm import Session

from app.models.core import Incident, ZoneRisk, IncidentStatus

try:
    import torch
    from transformers import CLIPModel, CLIPProcessor
except ImportError:  # pragma: no cover - handled gracefully at runtime
    torch = None
    CLIPModel = None
    CLIPProcessor = None

logger = logging.getLogger(__name__)

DISASTER_CANDIDATE_LABELS = [
    "a photo of a fire emergency",
    "a photo of a building fire",
    "a photo of a wildfire",
    "a photo of a flood disaster",
    "a photo of heavy flooding",
    "a photo of a car accident",
    "a photo of a road accident",
    "a photo of earthquake destruction",
    "a photo of collapsed buildings",
    "a photo of rescue workers at a disaster",
]
NORMAL_SCENE_LABELS = [
    "a normal everyday scene with no emergency",
    "a photo of a normal street with no emergency",
    "a photo of a house in normal conditions",
    "a photo of a peaceful outdoor scene",
    "a photo of regular daily life with no disaster",
]
ALL_CANDIDATE_LABELS = DISASTER_CANDIDATE_LABELS + NORMAL_SCENE_LABELS
NORMAL_SCENE_LABEL = "a normal everyday scene with no emergency"
DISASTER_SCORE_MIN = 0.35
NORMAL_ADVANTAGE_MARGIN = 0.12
MAX_AI_IMAGE_DIMENSION = 1600


class AIValidationError(RuntimeError):
    pass


class AIValidationService:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self.__class__._initialized:
            return

        self.model_name = "openai/clip-vit-base-patch32"
        self.model = None
        self.processor = None
        self.device = "cpu"
        self.load_error: str | None = None
        self.__class__._initialized = True
        self._load_model()

    def _load_model(self) -> None:
        if self.model is not None and self.processor is not None:
            return

        if torch is None or CLIPModel is None or CLIPProcessor is None:
            self.load_error = (
                "CLIP dependencies are not installed. Add torch, torchvision, transformers, and Pillow."
            )
            logger.warning(self.load_error)
            return

        try:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model = CLIPModel.from_pretrained(self.model_name)
            self.processor = CLIPProcessor.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            self.load_error = None
            logger.info("CLIP model loaded successfully on %s", self.device)
        except Exception as exc:  # pragma: no cover - depends on model download/runtime
            self.model = None
            self.processor = None
            self.load_error = f"Failed to load CLIP model: {exc}"
            logger.exception("CLIP model initialization failed")

    def warmup(self) -> None:
        self._load_model()

    def validate_image(self, image_bytes: bytes) -> dict:
        if not image_bytes:
            raise AIValidationError("Image file is empty.")

        if self.model is None or self.processor is None:
            self._load_model()

        if self.model is None or self.processor is None:
            raise AIValidationError(self.load_error or "AI validation model is unavailable.")

        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except UnidentifiedImageError as exc:
            raise AIValidationError("Uploaded file is not a valid image.") from exc
        except Exception as exc:
            raise AIValidationError(f"Unable to read uploaded image: {exc}") from exc

        if max(image.size) > MAX_AI_IMAGE_DIMENSION:
            image.thumbnail((MAX_AI_IMAGE_DIMENSION, MAX_AI_IMAGE_DIMENSION))

        try:
            inputs = self.processor(
                text=ALL_CANDIDATE_LABELS,
                images=image,
                return_tensors="pt",
                padding=True,
            )
            inputs = {key: value.to(self.device) for key, value in inputs.items()}
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits_per_image
                probabilities = logits.softmax(dim=1)[0]
        except Exception as exc:  # pragma: no cover - hardware/runtime specific
            raise AIValidationError(f"AI inference failed: {exc}") from exc

        confidence, index = probabilities.max(dim=0)
        predicted_label = ALL_CANDIDATE_LABELS[index.item()]
        confidence_score = float(confidence.item())
        probability_values = probabilities.tolist()

        disaster_score = float(sum(probability_values[: len(DISASTER_CANDIDATE_LABELS)]))
        normal_score = float(sum(probability_values[len(DISASTER_CANDIDATE_LABELS) :]))
        top_is_normal = predicted_label in NORMAL_SCENE_LABELS

        is_suspicious = (
            normal_score >= disaster_score + NORMAL_ADVANTAGE_MARGIN
            or (top_is_normal and confidence_score >= 0.30)
            or disaster_score < DISASTER_SCORE_MIN
        )

        if is_suspicious and not top_is_normal:
            predicted_label = NORMAL_SCENE_LABEL
            confidence_score = max(normal_score, confidence_score)

        return {
            "label": predicted_label,
            "confidence": confidence_score,
            "is_suspicious": is_suspicious,
            "disaster_score": disaster_score,
            "normal_score": normal_score,
        }


ai_validation_service = AIValidationService()

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
