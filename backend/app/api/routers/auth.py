from fastapi import APIRouter, HTTPException, status

from app.schemas import LoginRequest, LoginResponse


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    if payload.password != "nea123":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Demo token generation for local development.
    token = f"demo-token-{payload.directorate.lower()}"
    return LoginResponse(
        success=True,
        message="Login validated",
        token=token,
    )
