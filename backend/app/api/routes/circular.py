# pyright: reportArgumentType=false, reportGeneralTypeIssues=false, reportAttributeAccessIssue=false, reportCallIssue=false
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import os
import shutil
from sqlalchemy.sql import func

from app.deps.auth import require_admin_dept, get_current_dept
from app.db.database import get_db
from app.models.circular import Circular
from app.models.directorate import Directorate
from app.models.dept import Department
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
            suffix = db.query(Circular).filter(
                Circular.reference_no.like(f"{prefix}%")
            ).count()
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

    # 3. Between different directorates (Admin A -> Admin B or Admin A -> Provinces)
    if sender.directorate_id != receiver.directorate_id:
        if sender.is_administration:
            if receiver.is_administration or "Province" in receiver.name:
                return True

    return False


def _circular_to_dict(c: Circular, db: Session) -> dict:
    """Helper to serialize a circular with department/date fields."""
    sender = db.query(Department).filter(Department.id == c.sender_department_id).first()
    directorate = db.query(Directorate).filter(Directorate.id == sender.directorate_id).first() if sender else None
    c_dict = c.__dict__.copy()
    c_dict.pop("_sa_instance_state", None)
    c_dict["department"] = (
        f"{directorate.name} - {sender.name}" if directorate and sender
        else sender.name if sender
        else "Unknown"
    )
    created_at = getattr(c, "created_at", None)
    c_dict["date"] = created_at.strftime("%Y-%m-%d") if created_at else ""
    c_dict["time"] = created_at.strftime("%H:%M") if created_at else ""
    return c_dict


def _normalize_recipient_list(value):
    import json

    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid recipient data")

    return value or []


def _resolve_target_departments(db: Session, internal_ids, external_dir_ids):
    targets = []
    if internal_ids:
        targets.extend(db.query(Department).filter(Department.id.in_(internal_ids)).all())
    if external_dir_ids:
        targets.extend(
            db.query(Department)
            .filter(
                Department.directorate_id.in_(external_dir_ids),
                Department.is_administration == True
            )
            .all()
        )

    unique_targets = {dept.id: dept for dept in targets}.values()
    return list(unique_targets)


def _attach_recipient_records(db: Session, circular: Circular, targets: list[Department]):
    if not targets:
        return

    circular.receiver_department_id = targets[0].id
    for target in targets:
        exists = db.query(CircularRecipient).filter_by(
            circular_id=circular.id,
            department_id=target.id
        ).first()
        if not exists:
            db.add(CircularRecipient(
                circular_id=circular.id,
                department_id=target.id,
                status="unread"
            ))


def _validate_recipient_routing(sender: Department, current_dept: Department, circular: Circular, targets: list[Department], allow_internal_forward=False):
    routing_sender = current_dept if allow_internal_forward else sender
    valid_targets = []

    for target in targets:
        if target.id == current_dept.id:
            continue
        if not sender.is_administration and not sender.is_md and not target.is_administration:
            raise HTTPException(
                status_code=403,
                detail="Non-administration departments can only send to administration for confirmation"
            )
        if validate_routing(routing_sender, target):
            valid_targets.append(target)

    return valid_targets


# ─────────────────────────────────────────────
# Public endpoints  (no auth required)
# ─────────────────────────────────────────────

@router.get("/")
def list_all_circulars(db: Session = Depends(get_db)):
    circulars = db.query(Circular).filter(
        Circular.status == "sent",
        Circular.approval_status == "approved",
        Circular.is_archived == False,
        Circular.priority != "confidential"
    ).order_by(Circular.created_at.desc()).all()

    return [_circular_to_dict(c, db) for c in circulars]


# ─────────────────────────────────────────────
# Stats  (must come before /{circular_id})
# ─────────────────────────────────────────────

@router.get("/stats/public")
def get_public_circular_stats(db: Session = Depends(get_db)):
    """Unauthenticated stats: total public circular count only."""
    total = db.query(Circular).filter(
        Circular.status == "sent",
        Circular.approval_status == "approved",
        Circular.is_archived == False,
        Circular.priority != "confidential"
    ).count()
    return {"total": total}


@router.get("/stats")
def get_circular_stats(
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept),
):
    """
    Dashboard stats for the authenticated department.
    Always requires auth — never silently returns zeros for an unauthenticated caller.
    Fields: total, unread, sent, archived, pending.
    """
    inbox_query = (
        db.query(CircularRecipient)
        .join(Circular, CircularRecipient.circular_id == Circular.id)
        .join(Department, Circular.sender_department_id == Department.id)
        .filter(
            CircularRecipient.department_id == current_dept.id,
            Circular.status == "sent",
            Circular.approval_status == "approved",
            Circular.is_archived == False,
        )
    )

    unread_query = (
        db.query(CircularRecipient)
        .join(Circular, CircularRecipient.circular_id == Circular.id)
        .join(Department, Circular.sender_department_id == Department.id)
        .filter(
            CircularRecipient.department_id == current_dept.id,
            CircularRecipient.status == "unread",
            Circular.status == "sent",
            Circular.approval_status == "approved",
            Circular.is_archived == False,
        )
    )

    if current_dept.is_administration:
        inbox_query = inbox_query.filter(Department.directorate_id != current_dept.directorate_id)
        unread_query = unread_query.filter(Department.directorate_id != current_dept.directorate_id)

    inbox_total = inbox_query.count()
    unread = unread_query.count()

    sent_total = (
        db.query(Circular)
        .filter(
            Circular.sender_department_id == current_dept.id,
            Circular.status == "sent",
            Circular.is_archived == False
        )
        .count()
    )

    # Scoped to this dept's directorate so cross-directorate noise is excluded
    archived = (
        db.query(Circular)
        .filter(
            Circular.is_archived == True,
            Circular.sender_department_id.in_(
                db.query(Department.id).filter(
                    Department.directorate_id == current_dept.directorate_id
                )
            )
        )
        .count()
    )

    pending_count = 0
    if current_dept.is_administration:
        pending_count = (
            db.query(Circular)
            .filter(
                Circular.status == "pending_approval",
                Circular.is_archived == False,
                Circular.sender_department_id.in_(
                    db.query(Department.id).filter(
                        Department.directorate_id == current_dept.directorate_id
                    )
                )
            )
            .count()
        )

    return {
        "total": inbox_total,
        "unread": unread,
        "archived": archived,
        "sent": sent_total,
        "pending": pending_count,
    }
# ─────────────────────────────────────────────
# Admin Review  (must come before /{circular_id})
# ─────────────────────────────────────────────

@router.get("/admin-review")
def list_admin_review(
    db: Session = Depends(get_db),
    current_dept: Department = Depends(require_admin_dept)
):
    """
    List pending-approval circulars from internal departments in the same directorate.
    Only accessible to administration departments.
    """
    pending_circulars = (
        db.query(Circular)
        .filter(
            Circular.status == "pending_approval",
            Circular.is_archived == False,
            Circular.sender_department_id.in_(
                db.query(Department.id).filter(
                    Department.directorate_id == current_dept.directorate_id
                )
            )
        )
        .order_by(Circular.created_at.desc())
        .all()
    )

    return [_circular_to_dict(c, db) for c in pending_circulars]


# ─────────────────────────────────────────────
# Inbox  (must come before /{circular_id})
# ─────────────────────────────────────────────

@router.get("/inbox")
def list_inbox_circulars(
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept)
):
    """
    Inbox: approved/sent circulars addressed to this department.
    For admin departments, only from other directorates.
    For non-admin, all sent circulars.
    Pending-approval circulars are in /admin-review.
    """
    recipients_query = (
        db.query(CircularRecipient)
        .join(Circular, CircularRecipient.circular_id == Circular.id)
        .join(Department, Circular.sender_department_id == Department.id)
        .filter(
            CircularRecipient.department_id == current_dept.id,
            Circular.status == "sent",
            Circular.approval_status == "approved",
            Circular.is_archived == False,
        )
        .order_by(Circular.created_at.desc())
    )

    if current_dept.is_administration:
        recipients_query = recipients_query.filter(Department.directorate_id != current_dept.directorate_id)

    recipients = recipients_query.all()

    return [_circular_to_dict(r.circular, db) for r in recipients]


# ─────────────────────────────────────────────
# Recipients helper  (must come before /{circular_id})
# ─────────────────────────────────────────────

@router.get("/recipients")
def get_allowed_recipients(
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept)
):
    if current_dept.is_md:
        internal_depts = db.query(Department).all()
        external_directorates = db.query(Directorate).all()
    elif current_dept.is_administration:
        internal_depts = db.query(Department).filter(
            Department.directorate_id == current_dept.directorate_id,
            Department.id != current_dept.id
        ).all()
        
        # Add provinces to internal_depts so they can be selected individually
        provinces = db.query(Department).filter(
            Department.name.like("%Province%")
        ).all()
        
        # Don't add if they are already in internal_depts (i.e. if we are in G directorate)
        for p in provinces:
            if p not in internal_depts:
                internal_depts.append(p)
                
        external_directorates = db.query(Directorate).filter(
            Directorate.id != current_dept.directorate_id
        ).all()
    else:
        admin_dept = db.query(Department).filter(
            Department.directorate_id == current_dept.directorate_id,
            Department.is_administration == True
        ).first()
        internal_depts = [admin_dept] if admin_dept else []
        external_directorates = []

    return {
        "internal": [{"id": d.id, "name": d.name, "directorate_id": d.directorate_id} for d in internal_depts if d],
        "external": [{"id": dir.id, "name": dir.name} for dir in external_directorates]
    }


# ─────────────────────────────────────────────
# Archive list  (must come before /{circular_id})
# ─────────────────────────────────────────────

@router.get("/archive")
def list_archived_circulars(
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept)
):
    """List archived circulars visible to the current department."""
    return db.query(Circular).filter(Circular.is_archived == True).all()


# ─────────────────────────────────────────────
# Draft CRUD
# ─────────────────────────────────────────────

@router.post("/draft")
async def create_draft_circular(request: Request, db: Session = Depends(get_db)):
    """Create a new draft circular (JSON or multipart)."""
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        payload = await request.json()
        subject = payload.get("subject")
        description = payload.get("description")
        category = payload.get("category", "Administrative Policy")
        priority = payload.get("priority", "routine")
        sender_department_id = payload.get("sender_department_id")
        selected_internal_dept_ids = payload.get("selected_internal_dept_ids", [])
        selected_external_directorate_ids = payload.get("selected_external_directorate_ids", [])
        file = None
    else:
        form = await request.form()
        subject = form.get("subject")
        description = form.get("description")
        category = form.get("category", "Administrative Policy")
        priority = form.get("priority", "routine")
        sender_department_id = form.get("sender_department_id")
        selected_internal_dept_ids = form.get("selected_internal_dept_ids", [])
        selected_external_directorate_ids = form.get("selected_external_directorate_ids", [])
        file = form.get("file")

    if not subject or not description or sender_department_id is None:
        raise HTTPException(
            status_code=422,
            detail="subject, description, and sender_department_id are required"
        )

    try:
        sender_department_id = int(sender_department_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="sender_department_id must be an integer")

    import json
    try:
        selected_internal = json.loads(selected_internal_dept_ids) if isinstance(selected_internal_dept_ids, str) else selected_internal_dept_ids
        selected_external = json.loads(selected_external_directorate_ids) if isinstance(selected_external_directorate_ids, str) else selected_external_directorate_ids
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid recipient data")

    sender = db.query(Department).filter(Department.id == sender_department_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender department not found")

    file_url = None

    if file:
        allowed_types = ["application/pdf", "image/jpeg", "image/png"]

        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Only PDF, JPG, and PNG files are allowed")
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
        selected_internal_dept_ids=selected_internal,
        selected_external_directorate_ids=selected_external,
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
                    detail="Unable to generate a unique reference number. Please retry."
                )

            circular.reference_no = generate_reference_no(db)
            db.add(circular)


@router.post("/send")
async def send_new_circular(
    request: Request,
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept),
):
    """Compose and send a circular immediately without saving a draft first."""
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        payload = await request.json()
        subject = payload.get("subject")
        description = payload.get("description")
        category = payload.get("category", "Administrative Policy")
        priority = payload.get("priority", "routine")
        send_to_all = payload.get("send_to_all", False)
        selected_internal_dept_ids = payload.get("selected_internal_dept_ids", [])
        selected_external_directorate_ids = payload.get("selected_external_directorate_ids", [])
        file = None
    else:
        form = await request.form()
        subject = form.get("subject")
        description = form.get("description")
        category = form.get("category", "Administrative Policy")
        priority = form.get("priority", "routine")
        send_to_all = True if form.get("send_to_all", "false").lower() == "true" else False
        selected_internal_dept_ids = form.get("selected_internal_dept_ids", [])
        selected_external_directorate_ids = form.get("selected_external_directorate_ids", [])
        file = form.get("file")

    if not subject or not description:
        raise HTTPException(
            status_code=422,
            detail="subject and description are required"
        )

    if current_dept.is_md and send_to_all:
        selected_internal = []
        selected_external = []
        target_departments = db.query(Department).all()
    else:
        selected_internal = _normalize_recipient_list(selected_internal_dept_ids)
        selected_external = _normalize_recipient_list(selected_external_directorate_ids)

        if not isinstance(selected_internal, list) or not isinstance(selected_external, list):
            raise HTTPException(status_code=400, detail="Recipient lists must be arrays")

        if not selected_internal and not selected_external:
            raise HTTPException(status_code=400, detail="No recipients specified")

        target_departments = _resolve_target_departments(db, selected_internal, selected_external)

    if not current_dept.is_administration and not current_dept.is_md and selected_external and not send_to_all:
        raise HTTPException(status_code=403, detail="Non-administration departments cannot send to external directorates")

    if not target_departments:
        raise HTTPException(status_code=400, detail="No valid target departments specified")

    if current_dept.is_md and send_to_all:
        # MD sending to all bypasses normal routing checks
        valid_targets = [d for d in target_departments if d.id != current_dept.id]
    else:
        valid_targets = _validate_recipient_routing(current_dept, current_dept, None, target_departments)
    
    if not valid_targets:
        raise HTTPException(status_code=403, detail="Routing blocked")

    file_url = None
    if file and isinstance(file, UploadFile):
        allowed_types = ["application/pdf", "image/jpeg", "image/png"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Only PDF, JPG, and PNG files are allowed")
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
        sender_department_id=current_dept.id,
        selected_internal_dept_ids=selected_internal,
        selected_external_directorate_ids=selected_external,
        file_url=file_url,
        status="sent" if (current_dept.is_administration or current_dept.is_md) else "pending_approval",
        approval_status="approved" if (current_dept.is_administration or current_dept.is_md) else "pending",
    )

    db.add(circular)
    for attempt in range(3):
        try:
            db.commit()
            db.refresh(circular)
            break
        except IntegrityError:
            db.rollback()
            if attempt == 2:
                raise HTTPException(
                    status_code=500,
                    detail="Unable to generate a unique reference number. Please retry."
                )
            circular.reference_no = generate_reference_no(db)
            db.add(circular)

    if circular.status == "sent":
        _attach_recipient_records(db, circular, valid_targets)

    db.add(AuditLog(
        circular_id=circular.id,
        actor_id=current_dept.id,
        action="approved" if circular.status == "sent" else "submitted_for_approval"
    ))

    db.commit()
    db.refresh(circular)
    return circular


# ─────────────────────────────────────────────
# Single circular  (parametric — keep near bottom)
# ─────────────────────────────────────────────

@router.get("/{circular_id}")
def get_circular(
    circular_id: int,
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept)
):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    sender_dept = db.query(Department).filter(Department.id == circular.sender_department_id).first()

    if circular.status == "draft":
        if not sender_dept or sender_dept.id != current_dept.id:
            raise HTTPException(status_code=403, detail="Cannot access drafts from another department")

    if circular.status == "pending_approval":
        if not (
            current_dept.id == circular.sender_department_id
            or (current_dept.is_administration and sender_dept and current_dept.directorate_id == sender_dept.directorate_id)
        ):
            raise HTTPException(status_code=403, detail="Cannot access pending-approval circulars from another directorate")

    return circular


@router.put("/{circular_id}")
async def update_circular(
    circular_id: int,
    subject: str = Form(...),
    description: str = Form(...),
    category: str = Form("Administrative Policy"),
    priority: str = Form("routine"),
    sender_department_id: int = Form(...),
    selected_internal_dept_ids: str = Form("[]"),
    selected_external_directorate_ids: str = Form("[]"),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept),
):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    existing_sender = db.query(Department).filter(Department.id == circular.sender_department_id).first()

    if circular.status == "pending_approval":
        if not current_dept.is_administration or not existing_sender or current_dept.directorate_id != existing_sender.directorate_id:
            raise HTTPException(status_code=403, detail="Only administration can edit pending-approval circulars from this directorate")
    elif circular.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft circulars can be edited")

    if existing_sender and existing_sender.directorate_id != current_dept.directorate_id:
        raise HTTPException(status_code=403, detail="Cannot edit drafts of other directorates")

    sender = db.query(Department).filter(Department.id == sender_department_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender department not found")

    import json
    try:
        selected_internal = json.loads(selected_internal_dept_ids) if selected_internal_dept_ids else []
        selected_external = json.loads(selected_external_directorate_ids) if selected_external_directorate_ids else []
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid recipient data")

    circular.subject = subject
    circular.description = description
    circular.category = category
    circular.priority = priority
    circular.sender_department_id = sender_department_id
    circular.selected_internal_dept_ids = selected_internal
    circular.selected_external_directorate_ids = selected_external

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
    """Delete a draft circular (only drafts)."""
    circular = db.query(Circular).filter(Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    if circular.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft circulars can be deleted")

    sender = db.query(Department).filter(Department.id == circular.sender_department_id).first()
    if not sender or sender.id != current_dept.id:
        raise HTTPException(status_code=403, detail="Cannot delete drafts from another department")

    db.delete(circular)
    db.commit()
    return {"message": "Circular deleted successfully"}


# ─────────────────────────────────────────────
# Workflow actions  (send / approve / reject)
# ─────────────────────────────────────────────

@router.put("/{circular_id}/send")
def send_circular(
    circular_id: int,
    payload: SendCircularPayload,
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept),
):
    """
    Send a draft circular.
    - Non-admin/non-MD senders → status becomes pending_approval (no recipients yet).
    - Admin or MD senders → status becomes sent and recipients are created immediately.
    """
    circular = db.query(Circular).filter(Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    if circular.status not in {"draft", "pending_approval"}:
        raise HTTPException(status_code=400, detail="Circular is not in a sendable state")

    sender = db.query(Department).filter(Department.id == circular.sender_department_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender department not found")

    allowed_forward_by_admin = (
        circular.status == "pending_approval"
        and current_dept.is_administration
        and current_dept.directorate_id == sender.directorate_id
    )

    if sender.id != current_dept.id and not (current_dept.is_md or allowed_forward_by_admin):
        raise HTTPException(status_code=403, detail="Cannot send circular on behalf of another department")

    if not sender.is_administration and not sender.is_md and payload.external_directorate_ids:
        raise HTTPException(status_code=403, detail="Non-administration departments cannot send to external directorates")

    # Resolve target departments
    target_departments: set[Department] = set()
    if payload.internal_dept_ids:
        depts = db.query(Department).filter(Department.id.in_(payload.internal_dept_ids)).all()
        target_departments.update(depts)

    if payload.external_directorate_ids:
        admins = db.query(Department).filter(
            Department.directorate_id.in_(payload.external_directorate_ids),
            Department.is_administration == True
        ).all()
        target_departments.update(admins)

    if not target_departments:
        raise HTTPException(status_code=400, detail="No valid target departments specified")

    routing_sender = current_dept if allowed_forward_by_admin else sender
    valid_targets = []
    for target in target_departments:
        if target.id == current_dept.id:
            continue
        if not sender.is_administration and not sender.is_md and not target.is_administration:
            raise HTTPException(
                status_code=403,
                detail="Non-administration departments can only send to administration for confirmation"
            )
        if validate_routing(routing_sender, target):
            valid_targets.append(target)

    if not valid_targets:
        raise HTTPException(status_code=403, detail="Routing blocked")

    # Determine new status
    if allowed_forward_by_admin or sender.is_administration or sender.is_md:
        circular.status = "sent"
        circular.approval_status = "approved"
    else:
        circular.status = "pending_approval"
        circular.approval_status = "pending"

    # Only create recipient records once the circular is actually sent/approved
    if circular.status == "sent":
        circular.receiver_department_id = valid_targets[0].id
        for d in valid_targets:
            # Avoid duplicate recipient records
            exists = db.query(CircularRecipient).filter_by(
                circular_id=circular.id, department_id=d.id
            ).first()
            if not exists:
                db.add(CircularRecipient(
                    circular_id=circular.id,
                    department_id=d.id,
                    status="unread"
                ))

    action = "approved" if circular.status == "sent" else "submitted_for_approval"
    db.add(AuditLog(circular_id=circular.id, actor_id=current_dept.id, action=action))

    db.commit()
    db.refresh(circular)
    return circular


# ─────────────────────────────────────────────
# Forwarding (recipient admin can forward received circulars internally)
# ─────────────────────────────────────────────


@router.post("/{circular_id}/forward")
def forward_circular(
    circular_id: int,
    payload: SendCircularPayload,
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept),
):
    """
    Forward a received circular internally.
    - Only administration departments that are recipients of the circular can forward it.
    - Forwarding is restricted to internal departments within the forwarder's directorate.
    - External directorate forwarding is not allowed via this action.
    This creates a new circular record with the forwarder as sender so it appears in their Sent list.
    """
    circular = db.query(Circular).filter(Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    # Ensure current dept is administration
    if not current_dept.is_administration:
        raise HTTPException(status_code=403, detail="Only administration departments can forward received circulars")

    # Ensure current dept is a recipient of the circular
    recipient_record = db.query(CircularRecipient).filter(
        CircularRecipient.circular_id == circular_id,
        CircularRecipient.department_id == current_dept.id
    ).first()
    if not recipient_record:
        raise HTTPException(status_code=403, detail="You are not a recipient of this circular and cannot forward it")

    # Only internal targets allowed for forward
    internal_ids = payload.internal_dept_ids or []
    if not internal_ids:
        raise HTTPException(status_code=400, detail="No internal recipients specified for forwarding")

    # Fetch departments and ensure they belong to current_dept.directorate_id
    targets = db.query(Department).filter(Department.id.in_(internal_ids)).all()
    valid_targets = [d for d in targets if d.directorate_id == current_dept.directorate_id and d.id != current_dept.id]

    if not valid_targets:
        raise HTTPException(status_code=400, detail="No valid internal target departments in your directorate")

    # Attach recipient records to the original circular (do not create a new circular)
    for d in valid_targets:
        exists = db.query(CircularRecipient).filter_by(circular_id=circular.id, department_id=d.id).first()
        if not exists:
            db.add(CircularRecipient(circular_id=circular.id, department_id=d.id, status="unread"))

    # Log the forward action in audit logs (keeps reference number intact)
    db.add(AuditLog(circular_id=circular.id, actor_id=current_dept.id, action="forwarded"))

    db.commit()
    db.refresh(circular)

    return circular


@router.put("/{circular_id}/approve")
def approve_circular(
    circular_id: int,
    payload: SendCircularPayload,                      # ← admin supplies final recipients on approval
    db: Session = Depends(get_db),
    current_dept: Department = Depends(require_admin_dept),
):
    """
    Approve a pending circular (admin only).

    The admin must supply the final recipient lists in the request body
    (same shape as /send: internal_dept_ids + external_directorate_ids).
    This avoids ambiguity about who should receive the circular and
    prevents unintended "blast all departments" behaviour.
    """
    circular = db.query(Circular).filter(Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    if circular.status != "pending_approval":
        raise HTTPException(status_code=400, detail="Circular is not pending approval")

    sender = db.query(Department).filter(Department.id == circular.sender_department_id).first()
    if not sender or sender.directorate_id != current_dept.directorate_id:
        raise HTTPException(status_code=403, detail="Cannot approve circulars from other directorates")

    # ── Resolve recipients from the approval payload ──────────────────────────
    #
    # Priority:
    #   1. Use what the admin passed in the approval payload (explicit).
    #   2. Fall back to what the sender stored at draft time (selected_internal_dept_ids).
    #   3. Never auto-blast all departments.
    #
    internal_ids = payload.internal_dept_ids or circular.selected_internal_dept_ids or []
    external_dir_ids = payload.external_directorate_ids or circular.selected_external_directorate_ids or []

    recipient_dept_ids: set[int] = set(internal_ids)

    if external_dir_ids:
        external_admins = db.query(Department).filter(
            Department.directorate_id.in_(external_dir_ids),
            Department.is_administration == True
        ).all()
        recipient_dept_ids.update(d.id for d in external_admins)

    if not recipient_dept_ids:
        raise HTTPException(
            status_code=400,
            detail="No recipients specified. Provide internal_dept_ids or external_directorate_ids."
        )

    circular.status = "sent"
    circular.approval_status = "approved"

    for dept_id in recipient_dept_ids:
        exists = db.query(CircularRecipient).filter_by(
            circular_id=circular.id, department_id=dept_id
        ).first()
        if not exists:
            db.add(CircularRecipient(
                circular_id=circular.id,
                department_id=dept_id,
                status="unread"
            ))

    db.add(AuditLog(circular_id=circular.id, actor_id=current_dept.id, action="approved"))

    db.commit()
    db.refresh(circular)
    return circular


@router.put("/{circular_id}/reject")
def reject_circular(
    circular_id: int,
    db: Session = Depends(get_db),
    current_dept: Department = Depends(require_admin_dept),
):
    """Reject a pending circular (admin only). Returns it to draft state."""
    circular = db.query(Circular).filter(Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    if circular.status != "pending_approval":
        raise HTTPException(status_code=400, detail="Circular is not pending approval")

    sender = db.query(Department).filter(Department.id == circular.sender_department_id).first()
    if not sender or sender.directorate_id != current_dept.directorate_id:
        raise HTTPException(status_code=403, detail="Cannot reject circulars from other directorates")

    circular.status = "draft"
    circular.approval_status = "rejected"

    db.add(AuditLog(circular_id=circular.id, actor_id=current_dept.id, action="rejected"))

    db.commit()
    db.refresh(circular)
    return circular


# ─────────────────────────────────────────────
# Read / Archive / Permanent delete
# ─────────────────────────────────────────────

@router.put("/read/{circular_id}")
def mark_circular_read(
    circular_id: int,
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept),
):
    recipient = db.query(CircularRecipient).filter(
        CircularRecipient.circular_id == circular_id,
        CircularRecipient.department_id == current_dept.id,
    ).first()

    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient record not found")

    if recipient.status == "unread":
        recipient.status = "read"
        recipient.read_at = func.now()
        db.add(AuditLog(circular_id=circular_id, actor_id=current_dept.id, action="read"))
        db.commit()
        db.refresh(recipient)

    return recipient


@router.put("/archive/{circular_id}")
def archive_circular(
    circular_id: int,
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept)
):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    circular.is_archived = True
    db.commit()
    db.refresh(circular)
    return circular


@router.put("/unarchive/{circular_id}")
def unarchive_circular(
    circular_id: int,
    db: Session = Depends(get_db),
    current_dept: Department = Depends(get_current_dept)
):
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
    circular = db.query(Circular).filter(Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    sender = db.query(Department).filter(Department.id == circular.sender_department_id).first()
    if sender and sender.directorate_id != current_dept.directorate_id:
        raise HTTPException(status_code=403, detail="Cannot delete circulars belonging to other directorates")

    db.delete(circular)
    db.commit()
    return {"message": "Circular deleted successfully"}