from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta

from app.db.database import get_db
from app.models.dept import Department
from app.schemas.dept import DepartmentLogin
from app.core.security import verify_password, hash_password, create_access_token
from app.deps.auth import get_current_admin, get_current_dept
from app.core.settings import get_settings

router = APIRouter(prefix="/department", tags=["Auth"])
settings = get_settings()

@router.get("/me")
def get_me(current_dept: Department = Depends(get_current_dept)):
    return current_dept

@router.post("/login")
def login_department(data: DepartmentLogin, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(
        Department.name == data.name,
        Department.directorate.has(name=data.directorate)
    ).first()

    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    if not verify_password(data.password, dept.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password")

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)

    assigned_role = "admin" if dept.name == "Information Technology" else "department"

    token_payload = {
        "sub": str(dept.id),
        "dept_id": dept.id,
        "role": assigned_role,
        "directorate_id": dept.directorate_id,
        "is_administration": dept.is_administration,
        "is_md": dept.is_md,
    }

    access_token = create_access_token(
        data=token_payload, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful",
        "directorate": dept.directorate.name,
        "department": dept.name,
        "department_id": dept.id,
        "is_administration": dept.is_administration,
        "is_md": dept.is_md,
    }


@router.put("/update-password")
def update_password(data: DepartmentLogin, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(
        Department.name == data.name,
        Department.directorate.has(name=data.directorate)
    ).first()

    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    dept.hashed_password = hash_password(data.password)
    db.commit()

    return {"message": "Password updated successfully"}


@router.put("/admin/force-reset-password", dependencies=[Depends(get_current_admin)])
def force_reset_password(data: DepartmentLogin, db: Session = Depends(get_db)):
    """
    ADMIN ONLY: Forcibly overwrite a department's password without needing the old password.
    """
    dept = db.query(Department).filter(
        Department.name == data.name,
        Department.directorate.has(name=data.directorate)
    ).first()

    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    dept.hashed_password = hash_password(data.password)
    db.commit()

    return {"message": f"Password for {dept.name} forcefully reset to the new provided password."}
