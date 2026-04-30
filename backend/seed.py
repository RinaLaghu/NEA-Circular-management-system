from app.db.database import Base, engine, SessionLocal
from app.models.dept import Department
from app.core.security import hash_password

# create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

departments = [
    # A - Planning, Monitoring and IT
    {"directorate": "A", "name": "Corporate Planning and Monitoring", "password": "a123"},
    {"directorate": "A", "name": "Power System Management", "password": "a123"},
    {"directorate": "A", "name": "Information Technology", "password": "a123"},
    {"directorate": "A", "name": "Administration Section", "password": "a123"},

    # B - Business Development
    {"directorate": "B", "name": "Energy Efficiency and Loss Reduction", "password": "b123"},
    {"directorate": "B", "name": "Power Trade", "password": "b123"},
    {"directorate": "B", "name": "Company Management", "password": "b123"},
    {"directorate": "B", "name": "Business Promotion", "password": "b123"},
    {"directorate": "B", "name": "Administration Section", "password": "b123"},

    # C - Administration
    {"directorate": "C", "name": "Human Resources", "password": "c123"},
    {"directorate": "C", "name": "General Services", "password": "c123"},
    {"directorate": "C", "name": "Legal", "password": "c123"},
    {"directorate": "C", "name": "Recruitment Department", "password": "c123"},

    # D - Finance
    {"directorate": "D", "name": "Corporation Finance", "password": "d123"},
    {"directorate": "D", "name": "Accounts", "password": "d123"},
    {"directorate": "D", "name": "Regulatory Compliance", "password": "d123"},
    {"directorate": "D", "name": "Retirement Fund Management Division", "password": "d123"},

    # E
    {"directorate": "E", "name": "Large Generation Operation and Maintenance", "password": "e123"},
    {"directorate": "E", "name": "Medium Generation Operation and Maintenance", "password": "e123"},
    {"directorate": "E", "name": "Generation Development and Support", "password": "e123"},
    {"directorate": "E", "name": "Administration Division", "password": "e123"},
    {"directorate": "E", "name": "Finance Division", "password": "e123"},

    # F
    {"directorate": "F", "name": "High Voltage Grid Development", "password": "f123"},
    {"directorate": "F", "name": "Medium Voltage Grid Development", "password": "f123"},
    {"directorate": "F", "name": "Power System Operation", "password": "f123"},
    {"directorate": "F", "name": "Grid Operation", "password": "f123"},
    {"directorate": "F", "name": "Civil Division", "password": "f123"},
    {"directorate": "F", "name": "Transmission Line and Substation Design Division", "password": "f123"},
    {"directorate": "F", "name": "Administration Division", "password": "f123"},
    {"directorate": "F", "name": "Finance Division", "password": "f123"},

    # G
    {"directorate": "G", "name": "Planning and Technical Service", "password": "g123"},
    {"directorate": "G", "name": "Smart Metering and Automation", "password": "g123"},
    {"directorate": "G", "name": "Community and Rural Electrification", "password": "g123"},

    # H
    {"directorate": "H", "name": "Project Development", "password": "h123"},
    {"directorate": "H", "name": "Environment and Social Studies", "password": "h123"},
    {"directorate": "H", "name": "Geological Investigation", "password": "h123"},

    # I
    {"directorate": "I", "name": "Transmission Line and Substation", "password": "i123"},
    {"directorate": "I", "name": "Distribution Line and Substation", "password": "i123"},
    {"directorate": "I", "name": "Social Safeguard and Environment Management", "password": "i123"},
]

for d in departments:
    db.add(
        Department(
            directorate=d["directorate"],
            name=d["name"],
            hashed_password=hash_password(d["password"])
        )
    )

db.commit()
db.close()

print("All directorates and departments seeded successfully")
print("ENGINE:", engine.url)
