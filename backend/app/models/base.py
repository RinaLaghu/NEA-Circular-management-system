from sqlalchemy import Column, Integer, String, Boolean
from app.db.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)

    directorate = Column(String, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_administration = Column(Boolean, default=False)
    is_md = Column(Boolean, default=False)