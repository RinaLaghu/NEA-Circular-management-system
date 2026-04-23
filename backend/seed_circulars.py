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
        id="NEA/ADM/2024/042",
        subject="Emergency Protocol Update: Coastal Management 2024",
        description="Reference to Chapter 4, Section B.",
        priority="Urgent",
        department="Directorate of Operations",
        directorate="Operations",
        date="Oct 24, 2023",
        time="09:45 AM",
        status="unread",
        is_archived=0,
        file_url=None,
    ),
    Circular(
        id="NEA/FIN/2024/118",
        subject="Revised Budgetary Allocations for Q4 Fiscal Cycle",
        description="Immediate attention required for department heads.",
        priority="Urgent",
        department="Finance & Procurement",
        directorate="Finance",
        date="Oct 23, 2023",
        time="14:12 PM",
        status="unread",
        is_archived=0,
        file_url=None,
    ),
    Circular(
        id="NEA/SEC/2024/005",
        subject="Annual Security Clearance Procedures for External Staff",
        description="Formalizing third-party access control.",
        priority="Routine",
        department="Security Authority",
        directorate="Security",
        date="Oct 21, 2023",
        time="10:05 AM",
        status="read",
        is_archived=0,
        file_url=None,
    ),
    Circular(
        id="NEA/ICT/2023/882",
        subject="Digital Transformation Initiative: Cloud Implementation Phase II",
        description="Infrastructure migration schedule.",
        priority="Routine",
        department="ICT & Innovation",
        directorate="ICT",
        date="Oct 20, 2023",
        time="16:30 PM",
        status="read",
        is_archived=0,
        file_url=None,
    ),
    Circular(
        id="NEA/LEG/2023/156",
        subject="Amendments to Circular Drafting Standard ISO-9001",
        description="Updated templates for official notices.",
        priority="Routine",
        department="Legal Affairs",
        directorate="Legal",
        date="Oct 19, 2023",
        time="09:00 AM",
        status="read",
        is_archived=0,
        file_url=None,
    ),
]

db.add_all(circulars)
db.commit()
db.close()

print("✅ Circulars seeded successfully!")