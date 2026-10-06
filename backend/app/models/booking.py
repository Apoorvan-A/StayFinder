from __future__ import annotations

from datetime import date, datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.listing import Listing
    from app.models.review import Review
    from app.models.user import User


class BookingStatus:
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

    # Statuses that hold dates against a listing's availability.
    BLOCKING = ("pending", "confirmed")


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("check_out > check_in", name="ck_booking_date_order"),
        CheckConstraint("guest_count >= 1", name="ck_booking_guest_min"),
        CheckConstraint("total_cents >= 0", name="ck_booking_total_nonneg"),
        Index("ix_bookings_listing_status", "listing_id", "status"),
        Index("ix_bookings_guest", "guest_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"), nullable=False
    )
    guest_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    check_in: Mapped[date] = mapped_column(Date, nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)
    guest_count: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=BookingStatus.CONFIRMED, nullable=False)

    # Price snapshot — frozen at booking time so later price changes don't rewrite history.
    nightly_rate_snapshot_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    night_count: Mapped[int] = mapped_column(Integer, nullable=False)
    cleaning_fee_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    service_fee_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    taxes_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_cents: Mapped[int] = mapped_column(Integer, nullable=False)

    confirmation_code: Mapped[str] = mapped_column(String(12), unique=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    listing: Mapped[Listing] = relationship(back_populates="bookings")
    guest: Mapped[User] = relationship(back_populates="bookings")
    review: Mapped[Review | None] = relationship(back_populates="booking")
