from pydantic import BaseModel
from typing import Optional

class DepartmentLogin(BaseModel):
    directorate: str
    name: str
    password: str

class DepartmentCreate(BaseModel):
    directorate: str
    name: str
    password: str
    is_administration: bool = False
    is_md: bool = False

class DepartmentOut(BaseModel):
    id: int
    directorate: str
    name: str
    is_administration: bool
    is_md: bool
    
    class Config:
        from_attributes = True
    