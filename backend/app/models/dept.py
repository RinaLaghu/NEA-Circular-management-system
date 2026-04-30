from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_administration = Column(Boolean, default=False)
    is_md = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)


    directorate_id = Column(Integer, ForeignKey("directorates.id"), nullable=False)
    directorate = relationship("Directorate", back_populates="departments")
