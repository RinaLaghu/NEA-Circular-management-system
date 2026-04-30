from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.database import Base, engine
from app.api.routes.dept_login import router as dept_router
from app.api.routes.circular import router as circular_router
from app.api.routes import directorates, dept_crud
from app.deps.auth import get_current_user

app = FastAPI(title="Org Structure API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)

# Include routers with consistent API namespace
app.include_router(
    dept_router,
    prefix="/api/v1/dept_auth",
    tags=["Department Auth"]
)

app.include_router(
    circular_router,
    prefix="/api/v1/circular",
    tags=["Circular"],
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    directorates.router,
    prefix="/api/v1/directorates",
    tags=["Directorates"]
)

app.include_router(
    dept_crud.router,
    prefix="/api/v1/departments",
    tags=["Departments"]
)

# Static file serving
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
