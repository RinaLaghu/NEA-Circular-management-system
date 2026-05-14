from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import os
import shutil
from sqlalchemy.sql import func

from app.deps.auth import require_admin_dept, get_current_dept, get_current_dept_optional
from app.db.database import get_db
from app.models.circular import Circular
from app.models.dept import Department
from app.models.directorate import Directorate
from app.models.recepient import CircularRecipient
from app.models.audit_log import AuditLog
from pydantic import BaseModel
from typing import List

class SendCircularPayload(BaseModel):
    internal_dept_ids: List[int] = []
    external_directorate_ids: List[int] = []

router = APIRouter(prefix="/circular", tags=["Circular"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def generate_reference_no(db: Session):
    """Generate a unique reference number for circular."""
    year = datetime.now().year
    prefix = f"NEA-CIR-{year}-"
    latest = (
        db.query(Circular)
        .filter(Circular.reference_no.like(f"{prefix}%"))
        .order_by(Circular.reference_no.desc())
        .first()
    )

    if latest and latest.reference_no:
        try:
            suffix = int(latest.reference_no.rsplit("-", 1)[1])
        except (ValueError, IndexError):
            suffix = db.query(Circular).filter(Circular.reference_no.like(f"{prefix}%")).count()
        next_count = suffix + 1
    else:
        next_count = 1

    return f"{prefix}{next_count:04d}"


def validate_routing(sender: Department, receiver: Department):
    """Validate if sender can route to receiver."""
    # 1. MD can send to anyone
    if sender.is_md:
        return True
        
    # 2. Inside single directorate
    if sender.directorate_id == receiver.directorate_id:
        return True
        
    # 3. Between different directorates (Admin A -> Admin B)
    if sender.directorate_id != receiver.directorate_id:
        if sender.is_administration and receiver.is_administration:
            return True
            
    return False


@router.post("/draft")
async def create_draft_circular(request: Request, db: Session = Depends(get_db)):
    """
    Create a new draft circular.
    Accepts both JSON and multipart/form-data content types.
    """
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        payload = await request.json()
        subject = payload.get("subject")
        description = payload.get("description")
        category = payload.get("category", "Administrative Policy")
        priority = payload.get("priority", "routine")
        sender_department_id = payload.get("sender_department_id")
        receiver_department_id = payload.get("receiver_department_id")
        file = None
    else:
        form = await request.form()
        subject = form.get("subject")
        description = form.get("description")
        category = form.get("category", "Administrative Policy")
        priority = form.get("priority", "routine")
        sender_department_id = form.get("sender_department_id")
        file = form.get("file")

    if not subject or not description or sender_department_id is None:
        raise HTTPException(
            status_code=422,
            detail="subject, description, and sender_department_id are required"
        )

    try:
        sender_department_id = int(sender_department_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=422,
            detail="sender_department_id must be an integer"
        )

    sender = db.query(Department).filter(Department.id == sender_department_id).first()

    if not sender:
        raise HTTPException(status_code=404, detail="Sender department not found")

    file_url = None
    if file:
        allowed_types = ["application/pdf", "image/jpeg", "image/png"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Only PDF, JPG, and PNG files are allowed"
            )

        filename = f"{datetime.now().timestamp()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_url = f"/uploads/{filename}"

    circular = Circular(
        reference_no=generate_reference_no(db),
        subject=subject,
        description=description,
        category=category,
        priority=priority,
        sender_department_id=sender_department_id,
        file_url=file_url,
        status="draft",
    )

    db.add(circular)
    for attempt in range(3):
        try:
            db.commit()
            db.refresh(circular)
            return circular
        except IntegrityError:
            db.rollback()
            if attempt == 2:
                raise HTTPException(
                    status_code=500,
                    detail="Unable to generate a unique reference number for the draft. Please retry."
                )
            circular.reference_no = generate_reference_no(db)
            db.add(circular)


@router.get("/")
def list_all_circulars(db: Session = Depends(get_db)):
    """
    List all circulars.
    Used for admin/general viewing.
    """
    return db.query(Circular).all()

@router.get("/recipients")
def get_allowed_recipients(
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept)
):
    """
    Get allowed internal departments and external directorates for the current department.
    """
    if current_dept.is_md:
        internal_depts = db.query(Department).all()
        external_directorates = db.query(Directorate).all()
    else:
        internal_depts = db.query(Department).filter(
            Department.directorate_id == current_dept.directorate_id,
            Department.id != current_dept.id
        ).all()
        
        external_directorates = db.query(Directorate).filter(
            Directorate.id != current_dept.directorate_id
        ).all()
        
    return {
        "internal": [{"id": d.id, "name": d.name} for d in internal_depts],
        "external": [{"id": dir.id, "name": dir.name} for dir in external_directorates]
    }

@router.get("/stats")
def get_circular_stats(
    db: Session = Depends(get_db),
    current_dept: Department | None = Depends(get_current_dept_optional)
):
    """
    Get statistics for circulars.
    If logged in, returns stats for current department.
    If not logged in, returns general stats.
    """
    if not current_dept:
        inbox_total = db.query(Circular).filter(
            Circular.status == "sent",
            Circular.is_archived == False
        ).count()
        return {"total": inbox_total, "unread": 0, "archived": 0, "sent": 0}

    inbox_total = db.query(CircularRecipient).filter(
        CircularRecipient.department_id == current_dept.id
    ).count()

    unread = db.query(CircularRecipient).filter(
        CircularRecipient.department_id == current_dept.id,
        CircularRecipient.status == "unread"
    ).count()

    sent_total = db.query(Circular).filter(
        Circular.sender_department_id == current_dept.id,
        Circular.status == "sent",
        Circular.is_archived == False
    ).count()

    archived = db.query(Circular).filter(Circular.is_archived == True).count()

    return {"total": inbox_total, "unread": unread, "archived": archived, "sent": sent_total}


@router.get("/{circular_id}")
def get_circular(
    circular_id: int, 
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept)
):
    """Get a single circular by ID."""
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    # If it is a draft, restrict access to the sender's directorate
    if circular.status == "draft":
        sender_dept = db.query(Department).filter(Department.id == circular.sender_department_id).first()
        if sender_dept and sender_dept.directorate_id != current_dept.directorate_id:
            raise HTTPException(status_code=403, detail="Cannot access drafts of other directorates")

    return circular


@router.put("/{circular_id}")
async def update_circular(
    circular_id: int,
    subject: str = Form(...),
    description: str = Form(...),
    category: str = Form("Administrative Policy"),
    priority: str = Form("routine"),
    sender_department_id: int = Form(...),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept),
):
    """
    Update a circular.
    Only draft circulars can be updated.
    """
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    if circular.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft circulars can be edited")

    existing_sender = db.query(Department).filter(Department.id == circular.sender_department_id).first()
    if existing_sender and existing_sender.directorate_id != current_dept.directorate_id:
        raise HTTPException(status_code=403, detail="Cannot edit drafts of other directorates")

    sender = db.query(Department).filter(Department.id == sender_department_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender department not found")

    circular.subject = subject
    circular.description = description
    circular.category = category
    circular.priority = priority
    circular.sender_department_id = sender_department_id

    if file:
        allowed_types = ["application/pdf", "image/jpeg", "image/png"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Only PDF, JPG, and PNG files allowed")

        filename = f"{datetime.now().timestamp()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        circular.file_url = f"/uploads/{filename}"

    db.commit()
    db.refresh(circular)

    return circular


@router.delete("/{circular_id}")
def delete_circular(
    circular_id: int, 
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept)
):
    """
    Delete a circular.
    Only draft circulars can be deleted through this endpoint.
    """
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    if circular.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft circulars can be deleted")

    sender = db.query(Department).filter(Department.id == circular.sender_department_id).first()
    if sender and sender.directorate_id != current_dept.directorate_id:
        raise HTTPException(status_code=403, detail="Cannot delete drafts of other directorates")

    db.delete(circular)
    db.commit()

    return {"message": "Circular deleted successfully"}


@router.put("/{circular_id}/send")
def send_circular(
    circular_id: int,
    payload: SendCircularPayload,
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept),
):
    """
    Send a draft circular to all departments.
    Creates recipient records for each department and logs the action.
    """
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    if circular.status != "draft":
        raise HTTPException(status_code=400, detail="Circular is not a draft")

    sender = db.query(Department).filter(Department.id == circular.sender_department_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender department not found")
        
    if sender.id != current_dept.id and not current_dept.is_md:
        raise HTTPException(status_code=403, detail="Cannot send circular on behalf of another department")

    target_departments = set()
    
    # Process internal departments
    if payload.internal_dept_ids:
        depts = db.query(Department).filter(Department.id.in_(payload.internal_dept_ids)).all()
        for dept in depts:
            target_departments.add(dept)
            
    # Process external directorates
    if payload.external_directorate_ids:
        # For each external directorate, find its admin department
        admins = db.query(Department).filter(
            Department.directorate_id.in_(payload.external_directorate_ids),
            Department.is_administration == True
        ).all()
        for admin in admins:
            target_departments.add(admin)

    # Note: MD can send to anyone, but we'll still map directorates to their admin depts
    # If the user is MD and selects an external directorate, it sends to the admin of that directorate.
    
    if not target_departments:
        raise HTTPException(status_code=400, detail="No valid target departments specified")

    valid_targets = []
    for target in target_departments:
        if target.id == current_dept.id:
            continue # don't send to self
        if validate_routing(sender, target):
            valid_targets.append(target)
            
    if not valid_targets:
        raise HTTPException(
            status_code=403,
            detail="Routing blocked: you don't have permission to send to the specified recipients"
        )

    circular.status = "sent"
    if valid_targets:
        circular.receiver_department_id = valid_targets[0].id

    for d in valid_targets:
        recipient = CircularRecipient(
            circular_id=circular.id,
            department_id=d.id,
            status="unread"
        )
        db.add(recipient)

    audit_log = AuditLog(
        circular_id=circular.id,
        actor_id=current_dept.id,
        action="sent"
    )
    db.add(audit_log)

    db.commit()
    db.refresh(circular)

    return circular


@router.put("/read/{circular_id}")
def mark_circular_read(
    circular_id: int,
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept)
):
    """
    Mark a circular as read.
    Updates the recipient record status and logs the action.
    """
    recipient = db.query(CircularRecipient).filter(
        CircularRecipient.circular_id == circular_id,
        CircularRecipient.department_id == current_dept.id
    ).first()

    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient record not found")

    if recipient.status == "unread":
        recipient.status = "read"
        recipient.read_at = func.now()

        audit_log = AuditLog(
            circular_id=circular_id,
            actor_id=current_dept.id,
            action="read"
        )
        db.add(audit_log)

        db.commit()
        db.refresh(recipient)

    return recipient


@router.put("/acknowledge/{circular_id}")
def acknowledge_circular(
    circular_id: int,
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept)
):
    """
    Acknowledge a circular.
    Updates the recipient record status and logs the action.
    """
    recipient = db.query(CircularRecipient).filter(
        CircularRecipient.circular_id == circular_id,
        CircularRecipient.department_id == current_dept.id
    ).first()

    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient record not found")

    if recipient.status != "acknowledged":
        recipient.status = "acknowledged"
        recipient.acknowledged_at = func.now()

        audit_log = AuditLog(
            circular_id=circular_id,
            actor_id=current_dept.id,
            action="acknowledged"
        )
        db.add(audit_log)

        db.commit()
        db.refresh(recipient)

    return recipient


@router.get("/archive")
def list_archived_circulars(db: Session = Depends(get_db)):
    """List all archived circulars."""
    return db.query(Circular).filter(Circular.is_archived == True).all()


@router.put("/archive/{circular_id}")
def archive_circular(circular_id: int, db: Session = Depends(get_db)):
    """Archive a circular."""
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    circular.is_archived = True
    db.commit()
    db.refresh(circular)

    return circular


@router.put("/unarchive/{circular_id}")
def unarchive_circular(circular_id: int, db: Session = Depends(get_db)):
    """Unarchive a circular."""
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    circular.is_archived = False
    db.commit()
    db.refresh(circular)

    return circular


@router.delete("/delete/{circular_id}")
def permanently_delete_circular(
    circular_id: int, 
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept)
):
    """Permanently delete a circular."""
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    sender = db.query(Department).filter(Department.id == circular.sender_department_id).first()
    if sender and sender.directorate_id != current_dept.directorate_id:
        raise HTTPException(status_code=403, detail="Cannot delete circulars belonging to other directorates")

    db.delete(circular)
    db.commit()

    return {"message": "Circular deleted successfully"}


@router.get("/download/{circular_id}")
def download_circular(circular_id: int, db: Session = Depends(get_db)):
    """Download the attachment of a circular."""
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular or not circular.file_url:
        raise HTTPException(status_code=404, detail="File not found")

    filename = os.path.basename(circular.file_url)
    file_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, filename=filename)


