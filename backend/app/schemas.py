from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    directorate: str = Field(..., min_length=1, max_length=1)
    department: str = Field(..., min_length=1)
    password: str = Field(..., min_length=4)


class LoginResponse(BaseModel):
    success: bool
    message: str
    token: str | None = None
