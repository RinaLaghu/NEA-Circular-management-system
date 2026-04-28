from sqlalchemy import Column, Integer, String
from app.db.database import Base

class Directorate(Base):
    __tablename__ = "directorates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
