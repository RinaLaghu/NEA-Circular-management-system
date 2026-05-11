"""
Drafts route handler for managing draft circulars.
Handles listing of draft circulars (CRUD operations are in circular.py).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps.db import get_db
from app.deps.auth import get_current_dept
from app.models.circular import Circular
from app.models.dept import Department

router = APIRouter(prefix="/drafts", tags=["Drafts"])


@router.get("")
def list_drafts(
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept)
):
    """
    List all draft circulars for the logged-in department's directorate.
    Returns circulars with status="draft".
    """
    return (
        db.query(Circular)
        .join(Department, Circular.sender_department_id == Department.id)
        .filter(
            Circular.status == "draft",
            Department.directorate_id == current_dept.directorate_id
        )
        .all()
    )
