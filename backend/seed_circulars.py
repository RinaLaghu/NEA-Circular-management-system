import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import engine, SessionLocal, Base
from app.models.circular import Circular

# Create tables if not exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Clear existing circulars first
db.query(Circular).delete()
db.commit()

# Seed data
circulars = [
    Circular(
        reference_no="NEA/ADM/2024/042",
        subject="Emergency Protocol Update: Coastal Management 2024",
        description="Reference to Chapter 4, Section B.",
        priority="Urgent",
        sender_department_id=1,
        receiver_department_id=2,
        status="sent",
        is_archived=False,
        file_url=None,
    ),
    Circular(
        reference_no="NEA/FIN/2024/118",
        subject="Revised Budgetary Allocations for Q4 Fiscal Cycle",
        description="Immediate attention required for department heads.",
        priority="Urgent",
        sender_department_id=1,
        receiver_department_id=2,
        status="sent",
        is_archived=False,
        file_url=None,
    ),
    Circular(
        reference_no="NEA/SEC/2024/005",
        subject="Annual Security Clearance Procedures for External Staff",
        description="Formalizing third-party access control.",
        priority="Routine",
        sender_department_id=1,
        receiver_department_id=2,
        status="sent",
        is_archived=False,
        file_url=None,
    ),
    Circular(
        reference_no="NEA/ICT/2023/882",
        subject="Digital Transformation Initiative: Cloud Implementation Phase II",
        description="Infrastructure migration schedule.",
        priority="Routine",
        sender_department_id=1,
        receiver_department_id=2,
        status="sent",
        is_archived=False,
        file_url=None,
    ),
    Circular(
        reference_no="NEA/LEG/2023/156",
        subject="Amendments to Circular Drafting Standard ISO-9001",
        description="Updated templates for official notices.",
        priority="Routine",
        sender_department_id=1,
        receiver_department_id=2,
        status="sent",
        is_archived=False,
        file_url=None,
    ),
]

db.add_all(circulars)
db.commit()
db.close()

print("✅ Circulars seeded successfully!")