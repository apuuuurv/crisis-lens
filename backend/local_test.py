from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.core import User
from app.auth.security import create_access_token

client = TestClient(app)

def test_it():
    db = SessionLocal()
    # Ensure there's a user
    user = db.query(User).first()
    if not user:
        user = User(name="Test", email="test@test.com", password_hash="hash", role="citizen")
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "title": "First Fire",
        "description": "Just started",
        "category": "Fire",
        "latitude": 37.7749,
        "longitude": -122.4194
    }
    
    print("Posting to /incidents/...")
    res = client.post("/incidents/", json=payload, headers=headers)
    print("Status:", res.status_code)
    try:
        print("Response:", res.json())
    except:
        print("Response text:", res.text)

if __name__ == "__main__":
    test_it()
