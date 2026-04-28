from pydantic import BaseModel

class DirectorateBase(BaseModel):
    name: str

class DirectorateCreate(DirectorateBase):
    pass

class DirectorateOut(DirectorateBase):
    id: int
    class Config:
        orm_mode = True
