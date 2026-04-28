from app.db.database import Base, engine   # ✅ import the central Base and engine
# also import models so they are registered with Base
from app.models import dept, directorate   # ✅ ensures both tables are mapped

if __name__ == "__main__":
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Recreating tables...")
    Base.metadata.create_all(bind=engine)
    print("Database reset complete.")
