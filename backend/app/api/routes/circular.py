from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import os
import shutil
from app.deps.auth import require_admin_dept
from app.db.database import get_db
from app.models.circular import Circular
from app.models.dept import Department

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
        if sender.directorate_id == receiver.directorate_id:
            return True
        if receiver.is_administration:
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
def list_inbox(db: Session = Depends(get_db)):
    return db.query(Circular).filter(Circular.status != "draft", Circular.is_archived == False).all()


@router.get("/stats")
def get_circular_stats(db: Session = Depends(get_db)):
    total = db.query(Circular).filter(Circular.status != "draft", Circular.is_archived == False).count()
    unread = db.query(Circular).filter(Circular.status == "unread", Circular.is_archived == False).count()
    archived = db.query(Circular).filter(Circular.is_archived == True).count()
    return {"total": total, "unread": unread, "archived": archived}


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

    sender = db.query(Department).filter(Department.id == circular.sender_department_id).first()
    receiver = db.query(Department).filter(Department.id == circular.receiver_department_id).first()

    if not sender or not receiver:
        raise HTTPException(status_code=404, detail="Sender or receiver department not found")

    if not validate_routing(sender, receiver):
        raise HTTPException(
            status_code=403,
            detail="Routing blocked: regular departments cannot send circulars directly"
        )

    circular.status = "unread"
    db.commit()
    db.refresh(circular)

    return circular

@router.put("/read/{circular_id}")
def mark_circular_read(circular_id: int, db: Session = Depends(get_db)):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    circular.status = "read"
    db.commit()
    db.refresh(circular)

    return circular

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
