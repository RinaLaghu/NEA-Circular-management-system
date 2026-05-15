"""
Inbox route handler for managing received circulars.
Handles listing inbox circulars.
Read/acknowledge operations are in circular.py for proper routing.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps.db import get_db
from app.deps.auth import get_current_dept
from app.models.circular import Circular
from app.models.dept import Department
from app.models.directorate import Directorate
from app.models.recepient import CircularRecipient

router = APIRouter(prefix="/inbox", tags=["Inbox"])


@router.get("")
def list_inbox(db: Session = Depends(get_db), current_dept: Department = Depends(get_current_dept)):
    """
    List inbox circulars for the current department.
    Only approved/sent circulars addressed to this department from other directorates.
    Pending-approval circulars are handled separately in admin review.
    """
    rows = (
        db.query(CircularRecipient, Circular)
        .join(Circular, CircularRecipient.circular_id == Circular.id)
        .join(Department, Circular.sender_department_id == Department.id)
        .filter(
            CircularRecipient.department_id == current_dept.id,
            Circular.status == "sent",
            Circular.approval_status == "approved",
            Circular.is_archived == False,
            Department.directorate_id != current_dept.directorate_id
        )
        .order_by(Circular.created_at.desc())
        .all()
    )

    if not rows:
        return []

    result = []
    for rec, c in rows:
        sender = db.query(Department).filter(Department.id == c.sender_department_id).first()
        directorate = db.query(Directorate).filter(Directorate.id == sender.directorate_id).first() if sender else None
        c_dict = c.__dict__.copy()
        if "_sa_instance_state" in c_dict:
            del c_dict["_sa_instance_state"]
        c_dict["status"] = rec.status
        c_dict["department"] = f"{directorate.name} - {sender.name}" if directorate and sender else sender.name if sender else "Unknown"
        received_time = rec.received_at if rec.received_at else c.created_at
        c_dict["date"] = received_time.strftime("%Y-%m-%d") if received_time else ""
        c_dict["time"] = received_time.strftime("%H:%M") if received_time else ""
        result.append(c_dict)
    return result
