from fastapi import APIRouter, Depends, HTTPException
from fastapi import  UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.circular import Circular
from fastapi.responses import FileResponse, RedirectResponse
import shutil
import os
import uuid


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter( tags=["Circular"])

# CREATE circular
@router.post("/")
def create_circular(subject: str, file_url: str, db: Session = Depends(get_db)):
    c = Circular(id=str(uuid.uuid4()), subject=subject, file_url=file_url)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


# GET ALL (inbox)
@router.get("/inbox")
def get_inbox(db: Session = Depends(get_db)):
    return db.query(Circular).filter(Circular.is_archived == 0).all()


# GET ARCHIVE
@router.get("/archive")
def get_archive(db: Session = Depends(get_db)):
    return db.query(Circular).filter(Circular.is_archived == 1).all()


# ARCHIVE
@router.put("/archive/{cid:path}")
def archive(cid: str, db: Session = Depends(get_db)):
    c = db.query(Circular).filter(Circular.id == cid).first()

    if not c:
        raise HTTPException(404, "Not found")

    print("BEFORE:", c.is_archived)   # 🔥 ADD THIS

    c.is_archived = 1  # type: ignore
    db.commit()
    db.refresh(c)

    print("AFTER:", c.is_archived)    # 🔥 ADD THIS

    return {"message": "archived"}

# MARK READ
@router.put("/read/{cid}")
def mark_read(cid: int, db: Session = Depends(get_db)):
    c = db.query(Circular).filter(Circular.id == cid).first()
    if not c:
        raise HTTPException(404, "Not found")

    c.status = "read"  # type: ignore
    db.commit()
    return {"message": "read"}


# STATS
@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    return {
        "total": db.query(Circular).count(),
        "unread": db.query(Circular).filter(Circular.status == "unread").count(),
        "archived": db.query(Circular).filter(Circular.is_archived == 1).count(),
    }
    
    
@router.get("/download/{cid:path}")
def download_circular(cid: str, db: Session = Depends(get_db)):
    c = db.query(Circular).filter(Circular.id == cid).first()
    if not c:
        raise HTTPException(404, "Circular not found")
    if not c.file_url:  # type: ignore
        raise HTTPException(404, "No file attached to this circular")
    return RedirectResponse(url=c.file_url)  # type: ignore


@router.put("/unarchive/{cid:path}")
def unarchive(cid: str, db: Session = Depends(get_db)):
    c = db.query(Circular).filter(Circular.id == cid).first()
    if not c:
        raise HTTPException(404, "Not found")
    c.is_archived = 0  # type: ignore
    db.commit()
    return {"message": "unarchived"}

@router.delete("/delete/{cid:path}")
def delete_circular(cid: str, db: Session = Depends(get_db)):
    c = db.query(Circular).filter(Circular.id == cid).first()
    if not c:
        raise HTTPException(404, "Not found")
    db.delete(c)
    db.commit()
    return {"message": "deleted"}



@router.post("/upload")
async def upload_circular(
    subject: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_path = f"/uploads/{file.filename}"  # ✅ correct

    full_path = f"{UPLOAD_DIR}/{file.filename}"

    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_circular = Circular(
        subject=subject,
        description=description,
        file_url=file_path
    )

    db.add(new_circular)
    db.commit()
    db.refresh(new_circular)

    return {"msg": "Uploaded successfully", "file_url": file_path}