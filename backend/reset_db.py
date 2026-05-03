# backend/reset_db.py
from app.db.database import engine, Base

# Import all models so they are registered with Base
from app.models import directorate, dept, circular, user

if __name__ == "__main__":
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)

    print("Recreating tables...")
    Base.metadata.create_all(bind=engine)

    print("Database reset complete.")
