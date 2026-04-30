from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.directorate import Directorate
from app.schemas.directorate import DirectorateCreate, DirectorateUpdate, DirectorateOut
from app.deps.auth import require_admin_dept

router = APIRouter()

@router.get("/", response_model=List[DirectorateOut])
def list_directorates(db: Session = Depends(get_db)):
    return db.query(Directorate).filter(Directorate.is_active == True).all()

@router.get("/{id}", response_model=DirectorateOut)
def get_directorate(id: int, db: Session = Depends(get_db)):
    directorate = db.query(Directorate).filter(Directorate.id == id).first()
    if not directorate:
        raise HTTPException(status_code=404, detail="Directorate not found")
    return directorate

@router.post("/", response_model=DirectorateOut)
def create_directorate(
    payload: DirectorateCreate, 
    db: Session = Depends(get_db),
    #current_dept = Depends(require_admin_dept)
    ):
    directorate = Directorate(name=payload.name)
    db.add(directorate)
    db.commit()
    db.refresh(directorate)
    return directorate

@router.put("/{id}", response_model=DirectorateOut)
def update_directorate(
    id: int, 
    payload: DirectorateUpdate, 
    db: Session = Depends(get_db), 
    #current_dept = Depends(require_admin_dept)
    ):
    directorate = db.query(Directorate).filter(Directorate.id == id).first()
    if not directorate:
        raise HTTPException(status_code=404, detail="Directorate not found")
    if payload.name:
        directorate.name = payload.name
    if payload.is_active is not None:
        directorate.is_active = payload.is_active
    db.commit()
    db.refresh(directorate)
    return directorate

@router.delete("/{id}", response_model=dict)
def delete_directorate(
    id: int, 
    db: Session = Depends(get_db), 
    #current_dept = Depends(require_admin_dept)
    ):
    directorate = db.query(Directorate).filter(Directorate.id == id).first()
    if not directorate:
        raise HTTPException(status_code=404, detail="Directorate not found")
    db.delete(directorate)
    db.commit()
    return {"detail": "Directorate deleted successfully"}
