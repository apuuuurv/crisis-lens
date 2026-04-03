import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# 1. FORCE load the environment variables first!
load_dotenv()

# 2. Get the URL with a local SQLite fallback for easier development
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./disaster_network.db")

# Debug print: This will show in your terminal when you start the server
# It helps you confirm you aren't accidentally using SQLite.
if SQLALCHEMY_DATABASE_URL and "sqlite" in SQLALCHEMY_DATABASE_URL:
    print("⚠️ WARNING: Still using SQLite!")
else:
    print("🚀 SUCCESS: Connected to Cloud Database (Postgres)")

# SQLite requires "check_same_thread". Postgres does NOT.
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL and "sqlite" in SQLALCHEMY_DATABASE_URL else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()