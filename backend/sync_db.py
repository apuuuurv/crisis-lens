import sys
import os

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.models.core import User, Incident, Resource, Alert, ZoneRisk
from app.auth.security import get_password_hash

def sync_db():
    print("🔄 Resetting database schema on Cloud Postgres...")
    
    # 1. Drop all existing tables (DANGER)
    try:
        Base.metadata.drop_all(bind=engine)
        print("✅ Dropped old tables.")
    except Exception as e:
        print(f"❌ Error dropping tables: {e}")

    # 2. Recreate all tables based on current models
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Created new tables based on core.py models.")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return

    # 3. Seed initial data (Guest Account)
    db: Session = SessionLocal()
    try:
        print("🌱 Seeding initial data...")
        
        # Create Guest User
        guest_user = User(
            name="Guest User",
            email="guest@crisis.lens",
            password_hash=get_password_hash("guestPassword123"),
            role="citizen"
        )
        db.add(guest_user)
        
        # Create some initial resources
        resources = [
            Resource(type="Ambulance", status="available", latitude=37.7749, longitude=-122.4194),
            Resource(type="Fire Truck", status="available", latitude=37.7849, longitude=-122.4094),
            Resource(type="Police Patrol", status="available", latitude=37.7649, longitude=-122.4294),
        ]
        db.add_all(resources)
        
        db.commit()
        print("🚀 SUCCESS: Database synchronized and seeded.")
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    sync_db()
