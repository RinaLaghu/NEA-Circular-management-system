from sqlalchemy import Column, String, Text, Integer
from app.db.database import Base

class Circular(Base):
    __tablename__ = "circulars"

    id = Column(String, primary_key=True, index=True)
    subject = Column(String)
    description = Column(Text)

    priority = Column(String)
    department = Column(String)
    directorate = Column(String)

    date = Column(String)
    time = Column(String)

    status = Column(String, default="unread")  # unread / read
    is_archived = Column(Integer, default=0)

    file_url = Column(String, nullable=True)  # for download (PDF later)