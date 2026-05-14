from app.db.database import SessionLocal
from app.models.dept import Department
from app.models.directorate import Directorate
from app.core.security import hash_password
from seed import departments

def update_db():
    db = SessionLocal()
    try:
        directorates = {d.name: d for d in db.query(Directorate).all()}
        
        for d in departments:
            dir_obj = directorates.get(d['directorate'])
            if not dir_obj:
                continue
            
            # Check if dept exists
            dept = db.query(Department).filter(
                Department.directorate_id == dir_obj.id, 
                Department.name == d['name']
            ).first()
            
            if not dept:
                is_admin = 'Administration' in d['name']
                new_dept = Department(
                    directorate_id=dir_obj.id,
                    name=d['name'],
                    hashed_password=hash_password(d['password']),
                    is_administration=is_admin
                )
                db.add(new_dept)
                print(f"Added {d['name']} to Directorate {d['directorate']}")
        
        db.commit()
        print('Database update completed!')
    finally:
        db.close()

if __name__ == "__main__":
    update_db()
