from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db.database import Base, engine
from app.models.circular import Circular

# existing routers
from app.api.routes.directorate import router as directorate_router
from app.api.routes.dept_login import router as dept_login_router
from app.api.routes.dept_crud import router as dept_crud_router
from app.api.routes.circular import router as circular_router

# refactored routers for circular-related operations
from app.api.routes.drafts import router as drafts_router
from app.api.routes.inbox import router as inbox_router
from app.api.routes.sent import router as sent_router

# new routers
from app.api.routers.auth import router as auth_router        

from app.core.settings import get_settings

app = FastAPI(title="NEA Circular Management")
settings = get_settings()

# CORS middleware (must come AFTER app creation)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)

# Include routes
app.include_router(directorate_router)
app.include_router(dept_login_router)
app.include_router(dept_crud_router)

# Include refactored routers under /circular prefix
app.include_router(drafts_router, prefix="/circular")
app.include_router(inbox_router, prefix="/circular")
app.include_router(sent_router, prefix="/circular")
app.include_router(circular_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")