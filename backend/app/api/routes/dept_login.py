from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.dept import Department
from app.schemas.dept import DepartmentLogin, DepartmentCreate, DepartmentOut
from app.core.security import verify_password, hash_password, create_access_token
from app.deps.auth import get_current_user, get_current_admin
from datetime import timedelta
from app.core.settings import get_settings

router = APIRouter()
settings = get_settings()

@router.post("/login")
def login_department(data: DepartmentLogin, db: Session = Depends(get_db)):

    dept = db.query(Department).filter(
        Department.name == data.name,
        Department.directorate_id == data.directorate_id  
    ).first()

    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    if not verify_password(data.password, dept.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password")

    # Track D Preparation: Generate Token with sub and role
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    
    # Temporarily make "Information Technology" an admin so we can test the endpoint
    assigned_role = "admin" if dept.name == "Information Technology" else "department"  # type: ignore

    # We use "sub" for the ID to be standard, and "role" to define what type of user this is.
    token_payload = {
        "sub": str(dept.id),
        "dept_id": dept.id,
        "role": assigned_role,
        "directorate_id": dept.directorate_id, # keep backward compatibility with string for now
        "is_administration": dept.is_administration,
        "is_md": dept.is_md
    }
    
    access_token = create_access_token(
        data=token_payload, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful",
        "directorate": dept.directorate_id,
        "department": dept.name,
        "department_id": dept.id
    }

    

@router.put("/update-password", dependencies=[Depends(get_current_user)])
def update_password(data: DepartmentLogin, db: Session = Depends(get_db)):

    dept = db.query(Department).filter(
        Department.name == data.name,
        Department.directorate_id == data.directorate_id
    ).first()

    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    dept.hashed_password = hash_password(data.password)  # type: ignore

    db.commit()

    return {"message": "Password updated successfully"}


@router.put("/admin/force-reset-password", dependencies=[Depends(get_current_admin)])
def force_reset_password(data: DepartmentLogin, db: Session = Depends(get_db)):
    """
    ADMIN ONLY: Forcibly overwrite a department's password without needing the old password.
    """
    dept = db.query(Department).filter(
        Department.name == data.name,
        Department.directorate_id == data.directorate_id
    ).first()

    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    dept.hashed_password = hash_password(data.password)  # type: ignore

    db.commit()

    return {"message": f"Password for {dept.name} forcefully reset to the new provided password."}
