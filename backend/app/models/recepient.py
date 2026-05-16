from typing import Any
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class CircularRecipient(Base):
    __tablename__ = "circular_recipients"

    id = Column(Integer, primary_key=True, index=True)
    circular_id = Column(Integer, ForeignKey("circulars.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    
    status = Column(String, default="unread")  # unread, read, acknowledged
    
    received_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
