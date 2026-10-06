from fastapi import APIRouter, Response
from pydantic import BaseModel

from app.config import get_settings
from app.deps import CurrentUser, DbSession, clear_session_cookie, set_session_cookie
from app.models import User, UserRole
from app.schemas.common import MessageResponse
from app.schemas.user import AccountUser
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleLoginRequest(BaseModel):
    credential: str


class DemoLoginRequest(BaseModel):
    role: str = UserRole.GUEST


class AuthConfig(BaseModel):
    google_client_id: str


@router.get("/config", response_model=AuthConfig)
def auth_config() -> AuthConfig:
    """Public client config — lets the frontend know whether Google sign-in is available."""
    return AuthConfig(google_client_id=get_settings().google_client_id)


@router.get("/me", response_model=AccountUser)
def me(user: CurrentUser) -> User:
    return user


@router.post("/google", response_model=AccountUser)
def login_google(payload: GoogleLoginRequest, db: DbSession, response: Response) -> User:
    claims = auth_service.verify_google_credential(payload.credential)
    user = auth_service.upsert_google_user(db, claims)
    set_session_cookie(response, user.id)
    return user


@router.post("/demo", response_model=AccountUser)
def login_demo(payload: DemoLoginRequest, db: DbSession, response: Response) -> User:
    user = auth_service.get_demo_user(db, payload.role)
    set_session_cookie(response, user.id)
    return user


@router.post("/become-host", response_model=AccountUser)
def become_host(user: CurrentUser, db: DbSession) -> User:
    if user.role != UserRole.HOST:
        user.role = UserRole.HOST
        db.commit()
        db.refresh(user)
    return user


@router.post("/logout", response_model=MessageResponse)
def logout(response: Response) -> MessageResponse:
    clear_session_cookie(response)
    return MessageResponse(message="Signed out.")
