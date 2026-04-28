from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.directorate import Directorate
from app.schemas.directorate import DirectorateCreate, DirectorateOut, DirectorateUpdate

router = APIRouter(prefix="/directorates", tags=["Directorates"])

# Create Directorate (POST)
@router.post("/", response_model=DirectorateOut)
def create_directorate(data: DirectorateCreate, db: Session = Depends(get_db)):
    existing = db.query(Directorate).filter(Directorate.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Directorate already exists")
    new_dir = Directorate(name=data.name)
    db.add(new_dir)
    db.commit()
    db.refresh(new_dir)
    return new_dir

# List Directorates (GET)
@router.get("/", response_model=list[DirectorateOut])
def list_directorates(db: Session = Depends(get_db)):
    return db.query(Directorate).all()

# Update Directorate (PUT)
@router.put("/{directorate_id}")
def update_directorate(directorate_id: int, request: DirectorateUpdate, db: Session = Depends(get_db)):
    directorate = db.query(Directorate).filter(Directorate.id == directorate_id).first()
    if not directorate:
        raise HTTPException(status_code=404, detail="Directorate not found")

    directorate.name = request.name
    db.commit()
    db.refresh(directorate)
    return directorate

# Delete Directorate (DELETE)
@router.delete("/{directorate_id}")
def delete_directorate(directorate_id: int, db: Session = Depends(get_db)):
    directorate = db.query(Directorate).filter(Directorate.id == directorate_id).first()
    if not directorate:
        raise HTTPException(status_code=404, detail="Directorate not found")

    # Optional: prevent deletion if departments exist
    if directorate.departments and len(directorate.departments) > 0:
        raise HTTPException(status_code=400, detail="Cannot delete Directorate with existing Departments")

    db.delete(directorate)
    db.commit()
    return {"detail": "Directorate deleted successfully"}