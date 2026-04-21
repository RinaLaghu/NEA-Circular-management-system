from sqlalchemy import Column, Integer, String
from app.db.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)

    directorate = Column(String, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)

    password_hash = Column(String, nullable=False)