from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import bcrypt
from app.db.database import get_db
from app.models.dept import Department
from app.schemas.dept import DepartmentCreate, DepartmentUpdate, DepartmentOut
from app.deps.auth import get_current_admin

router = APIRouter()

@router.get("/by-directorate/{id}", response_model=List[DepartmentOut])
def list_departments_by_directorate(id: int, db: Session = Depends(get_db)):
    return db.query(Department).filter(Department.directorate_id == id, Department.is_active == True).all()

@router.post("/", response_model=DepartmentOut)#, dependencies=[Depends(require_admin_dept)])
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db)):
    # enforce one admin-dept per directorate
    if payload.is_administration:
        existing_admin = db.query(Department).filter(
            Department.directorate_id == payload.directorate_id,
            Department.is_administration == True
        ).first()
        if existing_admin:
            raise HTTPException(status_code=400, detail="Directorate already has an admin department")

    # enforce only one is_md dept system-wide
    if payload.is_md:
        existing_md = db.query(Department).filter(Department.is_md == True).first()
        if existing_md:
            raise HTTPException(status_code=400, detail="System already has an MD department")

    hashed_pw = bcrypt.hashpw(payload.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    dept = Department(
        name=payload.name,
        hashed_password=hashed_pw,
        directorate_id=payload.directorate_id,
        is_administration=payload.is_administration,
        is_md=payload.is_md
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.put("/{id}", response_model=DepartmentOut)#, dependencies=[Depends(require_admin_dept)])
def update_department(id: int, payload: DepartmentUpdate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    if payload.name:
        dept.name = payload.name
    if payload.is_active is not None:
        dept.is_active = payload.is_active
    db.commit()
    db.refresh(dept)
    return dept

@router.delete("/{id}", response_model=dict)#, dependencies=[Depends(require_admin_dept)])
def delete_department(id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"detail": "Department deleted successfully"}
