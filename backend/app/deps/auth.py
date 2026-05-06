from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.settings import get_settings
from app.deps.db import get_db
from app.models.dept import Department

settings = get_settings()

# This makes Swagger ask only for token, not username/password
security = HTTPBearer()


def get_current_dept(
    auth: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = auth.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )

        dept_id = payload.get("sub")

        if dept_id is None:
            raise credentials_exception

    except InvalidTokenError:
        raise credentials_exception

    dept = db.query(Department).filter(
        Department.id == int(dept_id)
    ).first()

    if dept is None:
        raise credentials_exception

    return dept


def require_md(current_dept: Department = Depends(get_current_dept)):
    if not current_dept.is_md:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="MD access required.",
        )

    return current_dept


def require_admin_dept(current_dept: Department = Depends(get_current_dept)):
    if not current_dept.is_administration:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administration department access required.",
        )

    return current_dept


# aliases for compatibility
require_sender = require_admin_dept
get_current_user = get_current_dept


def get_current_admin(current_dept: Department = Depends(get_current_dept)):
    if not current_dept.is_administration:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    return current_dept