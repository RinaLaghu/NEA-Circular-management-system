from pydantic import BaseModel
from typing import List, Optional

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

class CircularDetail(BaseModel):
    id: int
    reference_no: str
    subject: str
    description: str
    category: Optional[str]
    priority: str
    sender_department_id: int
    selected_internal_dept_ids: Optional[List[int]]
    selected_external_directorate_ids: Optional[List[int]]
    status: str
    approval_status: Optional[str]
    file_url: Optional[str]
    is_archived: bool

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