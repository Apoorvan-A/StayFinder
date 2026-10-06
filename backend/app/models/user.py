from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.favorite import Favorite
    from app.models.listing import Listing
    from app.models.review import Review


class UserRole:
    GUEST = "guest"
    HOST = "host"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    role: Mapped[str] = mapped_column(String(20), default=UserRole.GUEST, nullable=False)

    # External identity (Google) or "demo" for the built-in demo identities.
    provider: Mapped[str] = mapped_column(String(20), default="demo", nullable=False)
    provider_subject_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    is_superhost: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Marks the curated identities offered as instant demo logins.
    is_demo_switchable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    bio: Mapped[str | None] = mapped_column(String(1000))

    # Host profile details ("Meet your host"). Nullable — guests don't have them.
    host_since_year: Mapped[int | None] = mapped_column(Integer)
    response_rate: Mapped[int | None] = mapped_column(Integer)
    response_time: Mapped[str | None] = mapped_column(String(60))
    languages: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    listings: Mapped[list[Listing]] = relationship(
        back_populates="host", cascade="all, delete-orphan"
    )
    bookings: Mapped[list[Booking]] = relationship(back_populates="guest")
    reviews: Mapped[list[Review]] = relationship(back_populates="author")
    favorites: Mapped[list[Favorite]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
