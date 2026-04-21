from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.base import Department
from app.schemas import DepartmentLogin
from app.core.security import verify_password

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