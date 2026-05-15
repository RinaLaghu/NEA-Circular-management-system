from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from app.db.database import Base

class Circular(Base):
    __tablename__ = "circulars"

    id = Column(Integer, primary_key=True, index=True)

    reference_no = Column(String, unique=True, index=True, nullable=False)

    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=True)
    priority = Column(String, default="routine")

    sender_department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    receiver_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)

    # Store selected recipients for drafts
    selected_internal_dept_ids = Column(JSON, nullable=True)
    selected_external_directorate_ids = Column(JSON, nullable=True)

    status = Column(String, default="draft")  # draft / sent / pending_approval / approved
    approval_status = Column(String, nullable=True)  # pending / approved / rejected

    file_url = Column(String, nullable=True)

    is_archived = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())