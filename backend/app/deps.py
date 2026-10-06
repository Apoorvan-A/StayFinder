from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import UnauthorizedError
from app.models import User

DbSession = Annotated[Session, Depends(get_db)]


def get_optional_user(
    db: DbSession,
    x_demo_user_id: Annotated[int | None, Header(alias="X-Demo-User-Id")] = None,
) -> User | None:
    """Resolve the mocked demo user from the X-Demo-User-Id header, if present and valid."""
    if x_demo_user_id is None:
        return None
    return db.get(User, x_demo_user_id)


def get_current_user(
    user: Annotated[User | None, Depends(get_optional_user)],
) -> User:
    if user is None:
        raise UnauthorizedError("Select a demo user to continue.")
    return user


OptionalUser = Annotated["User | None", Depends(get_optional_user)]
CurrentUser = Annotated[User, Depends(get_current_user)]
