import io
import os
import json
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from google import genai # <-- NEW IMPORT
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure the new Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def _get_decimal_from_dms(dms, ref):
    """Converts EXIF Degrees/Minutes/Seconds to Decimal Coordinates."""
    degrees = dms[0]
    minutes = dms[1] / 60.0
    seconds = dms[2] / 3600.0
    
    decimal = degrees + minutes + seconds
    if ref in ['S', 'W']:
        decimal = -decimal
    return round(decimal, 6)

def extract_image_data(image_bytes: bytes, user_lat: float = None, user_lng: float = None):
    """
    Extracts GPS from image, uses Gemini to analyze the disaster AND 
    performs Genuine Report Validation (Location Match & AI Consistency).
    """
    image = Image.open(io.BytesIO(image_bytes))
    exif_data = image._getexif()
    
    meta_lat, meta_lng = None, None
    trust_score = 1.0 # Start perfect, deduct for discrepancies
    verification_notes = []

    # 1. Extract GPS Metadata from EXIF
    if exif_data:
        for tag, value in exif_data.items():
            decoded_tag = TAGS.get(tag, tag)
            if decoded_tag == "GPSInfo":
                gps_info = {}
                for t in value:
                    sub_tag = GPSTAGS.get(t, t)
                    gps_info[sub_tag] = value[t]
                
                if 'GPSLatitude' in gps_info and 'GPSLongitude' in gps_info:
                    meta_lat = _get_decimal_from_dms(gps_info['GPSLatitude'], gps_info['GPSLatitudeRef'])
                    meta_lng = _get_decimal_from_dms(gps_info['GPSLongitude'], gps_info['GPSLongitudeRef'])

    # 2. Location Match Check (Trust Score Reduction)
    # If the user pin differs significantly from the photo metadata, reduce trust score.
    final_lat, final_lng = (meta_lat, meta_lng) if meta_lat is not None else (user_lat, user_lng)
    
    if meta_lat and user_lat:
        from app.utils.geo import calculate_distance_km
        dist = calculate_distance_km(meta_lat, meta_lng, user_lat, user_lng)
        if dist > 0.5: # 500m discrepancy threshold
            trust_score -= 0.5
            verification_notes.append(f"Location Disparity: Image taken {round(dist, 1)}km away from report pin.")
    elif meta_lat is None:
        trust_score -= 0.2
        verification_notes.append("Metadata Check: No GPS data found in image EXIF.")

    # 3. Real AI Vision Analysis & Consistency Check with Gemini
    prompt = f"""
    Analyze this image and identify if there is any disaster, accident, or hazard.
    ALSO check if the visuals in the image represent a legitimate { 'reported incident' if not user_lat else 'crisis' }.
    Respond ONLY with a raw JSON object (no markdown). 
    Keys:
    - "title": A short title.
    - "description": Brief visual explanation.
    - "category": "Fire", "Flood", "Accident", "Medical", "Infrastructure", "Other".
    - "severity": Integer (1-10).
    - "is_physically_consistent": Boolean (Does the photo look real and consistent with a disaster scene?).
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, image]
        )
        
        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        ai_data = json.loads(clean_text)
        
        # Deduct score if AI thinks it's fake/inconsistent
        if not ai_data.get("is_physically_consistent", True):
            trust_score -= 0.6
            verification_notes.append("AI Consistency: Visuals appear doctored or inconsistent with report.")

        ai_analysis = {
            "title": ai_data.get("title", "Under Review"),
            "description": ai_data.get("description", "Awaiting manual audit."),
            "category": ai_data.get("category", "Other"),
            "severity": ai_data.get("severity", 5),
            "latitude": final_lat or 19.0760, # Fail-safe lat
            "longitude": final_lng or 72.8777, # Fail-safe lng
            "trust_score": max(0.0, trust_score),
            "verification_notes": "; ".join(verification_notes) if verification_notes else "Verified Authentic"
        }
    except Exception as e:
        print(f"Gemini AI Analysis Failed: {e}")
        ai_analysis = {
            "title": "Unverified User Upload", "description": "Manual review required.",
            "category": "Other", "severity": 1,
            "latitude": final_lat or 19.0760, "longitude": final_lng or 72.8777,
            "trust_score": 0.5, "verification_notes": "AI Analysis Failed: System offline."
        }

    return ai_analysis