"""
Drafts route handler for managing draft circulars.
Handles listing of draft circulars (CRUD operations are in circular.py).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps.db import get_db
from app.models.circular import Circular

router = APIRouter(prefix="/drafts", tags=["Drafts"])


@router.get("")
def list_drafts(db: Session = Depends(get_db)):
    """
    List all draft circulars.
    Returns circulars with status="draft".
    """
    return db.query(Circular).filter(Circular.status == "draft").all()
