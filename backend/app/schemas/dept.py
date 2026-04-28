from pydantic import BaseModel

# For CRUD
class DepartmentBase(BaseModel):
    name: str
    directorate_id: int

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: str | None = None
    directorate_id: int | None = None

class DepartmentOut(DepartmentBase):
    id: int
    class Config:
        from_attributes = True   # ✅ updated for Pydantic v2

# For login 
class DepartmentLogin(BaseModel):
    name: str
    directorate: str
    password: str
