from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.base import Department
from schemas.schemas import DepartmentLogin
from app.core.security import verify_password
from app.core.security import hash_password

router = APIRouter()

@router.post("/login")
def login_department(data: DepartmentLogin, db: Session = Depends(get_db)):

    dept = db.query(Department).filter(
        Department.directorate == data.directorate,
        Department.name == data.name
    ).first()

    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    if not verify_password(data.password, dept.password_hash):
        raise HTTPException(status_code=401, detail="Invalid password")

    return {
        "message": "Login successful",
        "directorate": dept.directorate,
        "department": dept.name,
        "department_id": dept.id
    }
    

@router.post("/add-department")
def add_department(data: DepartmentLogin, db: Session = Depends(get_db)):

    # check if already exists
    existing = db.query(Department).filter(
        Department.directorate == data.directorate,
        Department.name == data.name
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")

    new_dept = Department(
        directorate=data.directorate,
        name=data.name,
        password_hash=hash_password(data.password)
    )

    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)

    return {"message": "Department added successfully"}

@router.put("/update-password")
def update_password(data: DepartmentLogin, db: Session = Depends(get_db)):

    dept = db.query(Department).filter(
        Department.directorate == data.directorate,
        Department.name == data.name
    ).first()

    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    dept.password_hash = hash_password(data.password)

    db.commit()

    return {"message": "Password updated successfully"}

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()