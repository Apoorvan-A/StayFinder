"""Booking availability using half-open [check_in, check_out) intervals."""

from __future__ import annotations

from datetime import date

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models import Booking, BookingStatus


def _overlap_clause(check_in: date, check_out: date):
    """Two intervals overlap iff existing.start < requested.end AND existing.end > requested.start.

    Adjacency (existing.check_out == requested.check_in) does NOT overlap, so back-to-back
    stays are allowed.
    """
    return and_(
        Booking.check_in < check_out,
        Booking.check_out > check_in,
    )


def find_conflicts(
    db: Session,
    *,
    listing_id: int,
    check_in: date,
    check_out: date,
    exclude_booking_id: int | None = None,
) -> list[Booking]:
    stmt = (
        select(Booking)
        .where(Booking.listing_id == listing_id)
        .where(Booking.status.in_(BookingStatus.BLOCKING))
        .where(_overlap_clause(check_in, check_out))
    )
    if exclude_booking_id is not None:
        stmt = stmt.where(Booking.id != exclude_booking_id)
    return list(db.scalars(stmt).all())


def is_available(
    db: Session, *, listing_id: int, check_in: date, check_out: date
) -> bool:
    return not find_conflicts(
        db, listing_id=listing_id, check_in=check_in, check_out=check_out
    )


def booked_ranges(db: Session, *, listing_id: int, from_date: date) -> list[Booking]:
    """Active (blocking) bookings whose checkout is on/after `from_date`, for calendar display."""
    stmt = (
        select(Booking)
        .where(Booking.listing_id == listing_id)
        .where(Booking.status.in_(BookingStatus.BLOCKING))
        .where(Booking.check_out >= from_date)
        .order_by(Booking.check_in)
    )
    return list(db.scalars(stmt).all())
