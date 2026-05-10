from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.db.database import get_db
from app.models.dept import Department
from app.schemas.dept import DepartmentLogin
from app.core.security import verify_password, create_access_token
from app.core.settings import get_settings

router = APIRouter(prefix="/department", tags=["Auth"])
settings = get_settings()


@router.post("/login")
def login_department(payload: DepartmentLogin, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(
        Department.name == payload.name,
        Department.directorate.has(name=payload.directorate)
    ).first()

    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    if not verify_password(payload.password, dept.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")

    if not dept.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department inactive")

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)

    token_payload = {
        "sub": str(dept.id),
        "role": "admin" if dept.is_administration else "department",
        "directorate_id": dept.directorate_id,
        "is_administration": dept.is_administration,
        "is_md": dept.is_md,
    }

    access_token = create_access_token(data=token_payload, expires_delta=access_token_expires)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful",
        "department_id": dept.id,
        "department": dept.name,
        "directorate": dept.directorate.name,
        "is_administration": dept.is_administration,
    }
