"""
Sent route handler for managing sent circulars.
Handles listing circulars sent by the current department.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps.db import get_db
from app.deps.auth import get_current_dept
from app.models.circular import Circular
from app.models.dept import Department
from app.models.directorate import Directorate

router = APIRouter(prefix="/sent", tags=["Sent"])


@router.get("")
def list_sent(db: Session = Depends(get_db), current_dept: Department = Depends(get_current_dept)):
    """
    List all circulars sent by the current department.
    Filters by sender_department_id and status="sent".
    """
    circulars = db.query(Circular).filter(
        Circular.sender_department_id == current_dept.id,
        Circular.status == "sent",
        Circular.is_archived == False
    ).order_by(Circular.created_at.desc()).all()
    
    result = []
    for c in circulars:
        receiver = db.query(Department).filter(Department.id == c.receiver_department_id).first()
        directorate = db.query(Directorate).filter(Directorate.id == receiver.directorate_id).first() if receiver else None
        c_dict = c.__dict__.copy()
        if "_sa_instance_state" in c_dict:
            del c_dict["_sa_instance_state"]
        c_dict["department"] = f"{directorate.name} - {receiver.name}" if directorate and receiver else receiver.name if receiver else "Unknown"
        c_dict["date"] = c.created_at.strftime("%Y-%m-%d") if c.created_at else ""
        c_dict["time"] = c.created_at.strftime("%H:%M") if c.created_at else ""
        result.append(c_dict)
    return result
