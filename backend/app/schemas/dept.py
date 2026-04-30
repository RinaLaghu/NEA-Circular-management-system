from pydantic import BaseModel
from typing import Optional

# For login (keep directorate as string)
class DepartmentLogin(BaseModel):
    directorate: str
    name: str
    password: str

# For CRUD create
class DepartmentCreate(BaseModel):
    name: str
    directorate_id: int
    password: str
    is_administration: bool = False
    is_md: bool = False

# For CRUD update
class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None

# For output
class DepartmentOut(BaseModel):
    id: int
    name: str
    directorate_id: int
    is_administration: bool
    is_md: bool
    is_active: bool

    class Config:
        from_attributes = True
