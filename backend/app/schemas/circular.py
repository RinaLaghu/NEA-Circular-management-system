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

from datetime import datetime
from typing import Optional

class AuditLogOut(BaseModel):
    id: int
    circular_id: int
    actor_id: int
    action: str
    timestamp: datetime

    class Config:
        from_attributes = True

class CircularRecipientOut(BaseModel):
    id: int
    circular_id: int
    department_id: int
    status: str
    received_at: datetime
    read_at: Optional[datetime]
    acknowledged_at: Optional[datetime]

    class Config:
        from_attributes = True