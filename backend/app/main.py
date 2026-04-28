from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.models.circular import Circular
from fastapi.staticfiles import StaticFiles
from app.db.database import Base, engine
from app.api.routes.directorate import router as directorate_router
from app.api.routes.department_login import router as dept_router
from app.api.routes.dept_crud import router as dept_crud_router
from app.api.routes.circular import router as circular_router
from app.deps.auth import get_current_user

app = FastAPI()

# CORS middleware (must come AFTER app creation)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)

# Include routes
app.include_router(directorate_router)
app.include_router(dept_router, prefix="/department")
app.include_router(dept_crud_router, prefix="/departments")
app.include_router(circular_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
