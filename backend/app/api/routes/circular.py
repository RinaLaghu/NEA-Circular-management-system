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

router = APIRouter(prefix="/circular", tags=["Circular"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def generate_reference_no(db: Session):
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
    if sender.is_md:
        return True

    if sender.is_administration:
        return True

    return False


@router.post("/draft")
async def create_draft_circular(request: Request, db: Session = Depends(get_db)):
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
        receiver_department_id = form.get("receiver_department_id")
        file = form.get("file")

    if not subject or not description or sender_department_id is None or receiver_department_id is None:
        raise HTTPException(status_code=422, detail="subject, description, sender_department_id, and receiver_department_id are required")

    try:
        sender_department_id = int(sender_department_id)
        receiver_department_id = int(receiver_department_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="sender_department_id and receiver_department_id must be integers")

    sender = db.query(Department).filter(Department.id == sender_department_id).first()
    receiver = db.query(Department).filter(Department.id == receiver_department_id).first()

    if not sender:
        raise HTTPException(status_code=404, detail="Sender department not found")

    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver department not found")

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
        receiver_department_id=receiver_department_id,
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
def list_circulars(db: Session = Depends(get_db)):
    return db.query(Circular).all()


@router.get("/inbox")
def list_inbox(db: Session = Depends(get_db), current_dept: Department | None = Depends(get_current_dept_optional)):
    if not current_dept:
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

@router.get("/sent")
def list_sent(db: Session = Depends(get_db), current_dept: Department = Depends(get_current_dept)):
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

@router.get("/stats")
def get_circular_stats(db: Session = Depends(get_db), current_dept: Department | None = Depends(get_current_dept_optional)):
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


@router.get("/drafts")
def list_drafts(db: Session = Depends(get_db)):
    return db.query(Circular).filter(Circular.status == "draft").all()


@router.get("/archive")
def list_archived_circulars(db: Session = Depends(get_db)):
    return db.query(Circular).filter(Circular.is_archived == True).all()


@router.get("/{circular_id}")
def get_circular(circular_id: int, db: Session = Depends(get_db)):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    return circular


@router.put("/{circular_id}")
async def update_circular(
    circular_id: int,
    subject: str = Form(...),
    description: str = Form(...),
    category: str = Form("Administrative Policy"),
    priority: str = Form("routine"),
    sender_department_id: int = Form(...),
    receiver_department_id: int = Form(...),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    if circular.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft circulars can be edited")

    sender = db.query(Department).filter(Department.id == sender_department_id).first()
    receiver = db.query(Department).filter(Department.id == receiver_department_id).first()

    if not sender or not receiver:
        raise HTTPException(status_code=404, detail="Sender or receiver department not found")

    circular.subject = subject
    circular.description = description
    circular.category = category
    circular.priority = priority
    circular.sender_department_id = sender_department_id
    circular.receiver_department_id = receiver_department_id

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
def delete_circular(circular_id: int, db: Session = Depends(get_db)):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    if circular.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft circulars can be deleted")

    db.delete(circular)
    db.commit()

    return {"message": "Circular deleted successfully"}


@router.put("/{circular_id}/send")
def send_circular(
    circular_id: int,
    db: Session = Depends(get_db),
    current_dept: Department = Depends(require_admin_dept),
):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")
        
    if circular.status != "draft":
        raise HTTPException(status_code=400, detail="Circular is not a draft")

    sender = db.query(Department).filter(Department.id == circular.sender_department_id).first()
    receiver = db.query(Department).filter(Department.id == circular.receiver_department_id).first()

    if not sender or not receiver:
        raise HTTPException(status_code=404, detail="Sender or receiver department not found")

    if not validate_routing(sender, receiver):
        raise HTTPException(
            status_code=403,
            detail="Routing blocked: regular departments cannot send circulars directly"
        )

    circular.status = "sent"
    
    all_depts = db.query(Department).filter(Department.id != current_dept.id).all()
    for d in all_depts:
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

@router.put("/archive/{circular_id}")
def archive_circular(circular_id: int, db: Session = Depends(get_db)):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    circular.is_archived = True
    db.commit()
    db.refresh(circular)

    return circular

@router.put("/unarchive/{circular_id}")
def unarchive_circular(circular_id: int, db: Session = Depends(get_db)):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    circular.is_archived = False
    db.commit()
    db.refresh(circular)

    return circular

@router.delete("/delete/{circular_id}")
def delete_circular(circular_id: int, db: Session = Depends(get_db)):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    db.delete(circular)
    db.commit()

    return {"message": "Circular deleted successfully"}

@router.get("/download/{circular_id}")
def download_circular(circular_id: int, db: Session = Depends(get_db)):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular or not circular.file_url:
        raise HTTPException(status_code=404, detail="File not found")

    filename = os.path.basename(circular.file_url)
    file_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, filename=filename)