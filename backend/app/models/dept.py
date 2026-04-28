from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)

    # Foreign key to Directorate
    directorate_id = Column(Integer, ForeignKey("directorates.id"), nullable=False)

    directorate = relationship("Directorate", back_populates="departments")
