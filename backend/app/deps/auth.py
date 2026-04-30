from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.settings import get_settings
from app.deps.db import get_db
from app.models.dept import Department

settings = get_settings()

# Use HTTPBearer so Swagger UI just asks for the Token string directly!
security = HTTPBearer()

def get_current_dept(auth: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = auth.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        dept_id: str = payload.get("sub")
        if dept_id is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
    
    # Check the database for the active entity
    dept = db.query(Department).filter(Department.id == int(dept_id)).first()
    if dept is None:
        raise credentials_exception
    
    return dept

def require_md(current_dept: Department = Depends(get_current_dept)):
    if not current_dept.is_md:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="MD access required."
        )
    return current_dept

def require_admin_dept(current_dept: Department = Depends(get_current_dept)):
    if not current_dept.is_administration and not current_dept.is_md:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin access required."
        )
    return current_dept

require_sender = require_admin_dept

# Forward compatibility
get_current_user = get_current_dept

def get_current_admin(
    current_dept: Department = Depends(get_current_dept), 

    auth: HTTPAuthorizationCredentials = Depends(security)
):
    token = auth.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        role: str = payload.get("role")
        
        # Check if the role in the extracted token is "admin"
        if role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Not enough permissions. Admin access required."
            )
    except InvalidTokenError:
        raise credentials_exception
        
    return current_dept
