from pydantic import BaseModel
from typing import Optional

class DirectorateBase(BaseModel):
    name: str

class DirectorateCreate(DirectorateBase):
    pass

class DirectorateUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class DirectorateOut(DirectorateBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True
