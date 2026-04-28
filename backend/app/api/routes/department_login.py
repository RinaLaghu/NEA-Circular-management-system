from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.dept import Department
from schemas.dept import DepartmentLogin
from app.core.security import verify_password, hash_password, create_access_token
from app.deps.auth import get_current_user, get_current_admin
from datetime import timedelta
from app.core.settings import get_settings

router = APIRouter()
settings = get_settings()

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

    # Track D Preparation: Generate Token with sub and role
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    
    # Temporarily make "Information Technology" an admin so we can test the endpoint
    assigned_role = "admin" if data.name == "Information Technology" else "department"

    # We use "sub" for the ID to be standard, and "role" to define what type of user this is.
    token_payload = {
        "sub": str(dept.id),
        "role": assigned_role,  
        "directorate": dept.directorate,
        "department_name": dept.name
    }
    
    access_token = create_access_token(
        data=token_payload, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful",
        "directorate": dept.directorate,
        "department": dept.name,
        "department_id": dept.id
    }

    

@router.post("/add-department", dependencies=[Depends(get_current_admin)])
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

@router.put("/update-password", dependencies=[Depends(get_current_user)])
def update_password(data: DepartmentLogin, db: Session = Depends(get_db)):

    dept = db.query(Department).filter(
        Department.directorate == data.directorate,
        Department.name == data.name
    ).first()

    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    dept.password_hash = hash_password(data.password)  # type: ignore

    db.commit()

    return {"message": "Password updated successfully"}

@router.get("/departments", dependencies=[Depends(get_current_user)])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()


@router.put("/admin/force-reset-password", dependencies=[Depends(get_current_admin)])
def force_reset_password(data: DepartmentLogin, db: Session = Depends(get_db)):
    """
    ADMIN ONLY: Forcibly overwrite a department's password without needing the old password.
    """
    dept = db.query(Department).filter(
        Department.directorate == data.directorate,
        Department.name == data.name
    ).first()

    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    dept.password_hash = hash_password(data.password)  # type: ignore

    db.commit()

    return {"message": f"Password for {dept.name} forcefully reset to the new provided password."}
