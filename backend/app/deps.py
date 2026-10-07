from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request, Response
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.errors import UnauthorizedError
from app.models import User
from app.services.auth_service import create_session_token, read_session_token

DbSession = Annotated[Session, Depends(get_db)]

settings = get_settings()


def get_optional_user(request: Request, db: DbSession) -> User | None:
    """Resolve the authenticated user from the signed, HttpOnly session cookie."""
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        return None
    user_id = read_session_token(token)
    if user_id is None:
        return None
    return db.get(User, user_id)


def get_current_user(user: Annotated[User | None, Depends(get_optional_user)]) -> User:
    if user is None:
        raise UnauthorizedError("Please sign in to continue.")
    return user


def set_session_cookie(response: Response, user_id: int) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=create_session_token(user_id),
        max_age=settings.session_max_age_seconds,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/",
    )


OptionalUser = Annotated["User | None", Depends(get_optional_user)]
CurrentUser = Annotated[User, Depends(get_current_user)]
