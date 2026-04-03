from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

print("Connecting to", SQLALCHEMY_DATABASE_URL)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE incidents ADD COLUMN report_count INTEGER DEFAULT 1;"))
    print("Done adding report_count")
except Exception as e:
    print("Error:", e)

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE incidents ALTER COLUMN severity DROP NOT NULL;"))
    print("Done altering severity")
except Exception as e:
    print("Error:", e)
