from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os
import shutil

from app.db.database import get_db
from app.models.circular import Circular
from app.models.dept import Department

router = APIRouter(prefix="/circular", tags=["Circular"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def generate_reference_no(db: Session):
    year = datetime.now().year
    count = db.query(Circular).count() + 1
    return f"NEA-CIR-{year}-{count:04d}"


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
async def create_draft_circular(
    subject: str = Form(...),
    description: str = Form(...),
    category: str = Form("Administrative Policy"),
    priority: str = Form("routine"),
    sender_department_id: int = Form(...),
    receiver_department_id: int = Form(...),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    sender = db.query(Department).filter(Department.id == sender_department_id).first()
    receiver = db.query(Department).filter(Department.id == receiver_department_id).first()

    if not sender:
        raise HTTPException(status_code=404, detail="Sender department not found")

    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver department not found")

    if not validate_routing(sender, receiver):
        raise HTTPException(
            status_code=403,
            detail="Routing blocked: regular departments cannot send circulars directly"
        )

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
    db.commit()
    db.refresh(circular)

    return circular


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

    if not validate_routing(sender, receiver):
        raise HTTPException(status_code=403, detail="Routing blocked")

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
def send_circular(circular_id: int, db: Session = Depends(get_db)):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()

    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

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
