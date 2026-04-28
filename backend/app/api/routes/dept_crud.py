from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.dept import Department
from app.schemas.dept import DepartmentCreate, DepartmentUpdate, DepartmentOut

router = APIRouter(
    tags=["Departments"]
)

# Create Department
@router.post("/", response_model=DepartmentOut)
def create_department(department: DepartmentCreate, db: Session = Depends(get_db)):
    new_dept = Department(**department.dict())
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept

# List Departments
@router.get("/", response_model=List[DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

# Update Department
@router.put("/{id}", response_model=DepartmentOut)
def update_department(id: int, department: DepartmentUpdate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for key, value in department.dict(exclude_unset=True).items():
        setattr(dept, key, value)
    db.commit()
    db.refresh(dept)
    return dept

# Delete Department
@router.delete("/{id}")
def delete_department(id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted successfully"}
