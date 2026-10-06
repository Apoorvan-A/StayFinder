from fastapi import APIRouter
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.models import User
from app.schemas.user import UserPublic

router = APIRouter(tags=["users"])


@router.get("/users/demo", response_model=list[UserPublic])
def demo_users(db: DbSession) -> list[User]:
    """Switchable demo identities for the mocked-auth user switcher."""
    return list(
        db.scalars(
            select(User).where(User.is_demo_switchable.is_(True)).order_by(User.id)
        ).all()
    )


@router.get("/users/me", response_model=UserPublic)
def me(user: CurrentUser) -> User:
    return user
