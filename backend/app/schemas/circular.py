from pydantic import BaseModel

class CircularBase(BaseModel):
    id: str
    subject: str
    description: str
    priority: str
    department: str
    directorate: str
    date: str
    time: str


class CircularOut(CircularBase):
    status: str
    is_archived: int
    file_url: str | None

    class Config:
        from_attributes = True