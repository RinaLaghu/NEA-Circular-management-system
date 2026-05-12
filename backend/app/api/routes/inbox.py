"""
Inbox route handler for managing received circulars.
Handles listing inbox circulars.
Read/acknowledge operations are in circular.py for proper routing.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps.db import get_db
from app.deps.auth import get_current_dept, get_current_dept_optional
from app.models.circular import Circular
from app.models.dept import Department
from app.models.directorate import Directorate
from app.models.recepient import CircularRecipient

router = APIRouter(prefix="/inbox", tags=["Inbox"])


@router.get("")
def list_inbox(db: Session = Depends(get_db), current_dept: Department | None = Depends(get_current_dept_optional)):
    """
    List inbox circulars for the current department.
    If not logged in, returns all public (non-confidential) sent circulars.
    """
    if not current_dept:
        # Public inbox - show all sent, non-archived, non-confidential circulars
        circulars = db.query(Circular).filter(
            Circular.status == "sent",
            Circular.is_archived == False,
            Circular.priority != "confidential"
        ).order_by(Circular.created_at.desc()).all()
        result = []
        for c in circulars:
            sender = db.query(Department).filter(Department.id == c.sender_department_id).first()
            directorate = db.query(Directorate).filter(Directorate.id == sender.directorate_id).first() if sender else None
            c_dict = c.__dict__.copy()
            if "_sa_instance_state" in c_dict:
                del c_dict["_sa_instance_state"]
            c_dict["department"] = f"{directorate.name} - {sender.name}" if directorate and sender else sender.name if sender else "Unknown"
            c_dict["date"] = c.created_at.strftime("%Y-%m-%d") if c.created_at else ""
            c_dict["time"] = c.created_at.strftime("%H:%M") if c.created_at else ""
            result.append(c_dict)
        return result

    # Department-specific inbox
    recipients = db.query(CircularRecipient).filter(CircularRecipient.department_id == current_dept.id).all()
    circular_ids = [r.circular_id for r in recipients]
    
    if not circular_ids:
        return []

    circulars = db.query(Circular).filter(
        Circular.id.in_(circular_ids),
        Circular.is_archived == False
    ).order_by(Circular.created_at.desc()).all()
    
    result = []
    for c in circulars:
        rec = next((r for r in recipients if r.circular_id == c.id), None)
        sender = db.query(Department).filter(Department.id == c.sender_department_id).first()
        directorate = db.query(Directorate).filter(Directorate.id == sender.directorate_id).first() if sender else None
        c_dict = c.__dict__.copy()
        if "_sa_instance_state" in c_dict:
            del c_dict["_sa_instance_state"]
        c_dict["status"] = rec.status if rec else c.status
        c_dict["department"] = f"{directorate.name} - {sender.name}" if directorate and sender else sender.name if sender else "Unknown"
        received_time = rec.received_at if rec and rec.received_at else c.created_at
        c_dict["date"] = received_time.strftime("%Y-%m-%d") if received_time else ""
        c_dict["time"] = received_time.strftime("%H:%M") if received_time else ""
        result.append(c_dict)
    return result
