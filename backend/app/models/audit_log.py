from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    circular_id = Column(Integer, ForeignKey("circulars.id"), nullable=False)
    actor_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    
    action = Column(String, nullable=False)  # e.g., created, sent, read, acknowledged
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
