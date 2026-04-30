from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    department_id: int
    
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    department_id: int          # must belong to a dept

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    is_active: bool
    department_id: int

    class Config:
        from_attributes = True