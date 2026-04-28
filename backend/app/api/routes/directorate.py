from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.directorate import Directorate
from schemas.directorate import DirectorateCreate, DirectorateOut

router = APIRouter(prefix="/directorates", tags=["Directorates"])

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

@router.get("/", response_model=list[DirectorateOut])
def list_directorates(db: Session = Depends(get_db)):
    return db.query(Directorate).all()
