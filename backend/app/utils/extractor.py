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

def extract_image_data(image_bytes: bytes):
    """Extracts GPS from image and uses the new Gemini Client to analyze the disaster."""
    image = Image.open(io.BytesIO(image_bytes))
    exif_data = image._getexif()
    
    latitude, longitude = None, None

    # 1. Extract GPS Data
    if exif_data:
        for tag, value in exif_data.items():
            decoded_tag = TAGS.get(tag, tag)
            if decoded_tag == "GPSInfo":
                gps_info = {}
                for t in value:
                    sub_tag = GPSTAGS.get(t, t)
                    gps_info[sub_tag] = value[t]
                
                if 'GPSLatitude' in gps_info and 'GPSLongitude' in gps_info:
                    latitude = _get_decimal_from_dms(gps_info['GPSLatitude'], gps_info['GPSLatitudeRef'])
                    longitude = _get_decimal_from_dms(gps_info['GPSLongitude'], gps_info['GPSLongitudeRef'])

    # Fallback to Mumbai if no GPS data is found in the image
    if latitude is None or longitude is None:
        latitude, longitude = 19.0760, 72.8777 

    # 2. Real AI Vision Analysis with the new Gemini SDK
    prompt = """
    Analyze this image and identify if there is any disaster, accident, or hazard.
    Respond ONLY with a raw JSON object (do not include markdown tags like ```json). 
    Use exactly these keys:
    - "title": A short, urgent title for the incident.
    - "description": A brief explanation of what is visually happening.
    - "category": Choose one of: "Fire", "Flood", "Accident", "Medical", "Infrastructure", "Other".
    - "severity": An integer from 1 to 10 indicating the danger level (10 being catastrophic).
    """
    
    try:
        # Send image and prompt to Gemini using the new syntax and latest model
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, image]
        )
        
        # Clean up the response in case the model adds markdown formatting
        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        ai_data = json.loads(clean_text)
        
        ai_analysis = {
            "title": ai_data.get("title", "Unknown Incident"),
            "description": ai_data.get("description", "No description available."),
            "category": ai_data.get("category", "Other"),
            "severity": ai_data.get("severity", 5),
            "latitude": latitude,
            "longitude": longitude
        }
    except Exception as e:
        print(f"Gemini AI Analysis Failed: {e}")
        # Fallback if the AI fails or hits a rate limit
        ai_analysis = {
            "title": "Unverified User Upload",
            "description": "Image uploaded, awaiting manual review.",
            "category": "Other",
            "severity": 1,
            "latitude": latitude,
            "longitude": longitude
        }

    return ai_analysis