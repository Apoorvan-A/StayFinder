from __future__ import annotations

import secrets
import string
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.errors import (
    BookingConflictError,
    ForbiddenError,
    ListingNotFoundError,
    NotFoundError,
    ValidationError,
)
from app.models import Booking, BookingStatus, Listing
from app.services import availability
from app.services.pricing import PriceBreakdown, calculate_price, nights_between

_CODE_ALPHABET = string.ascii_uppercase + string.digits


def _generate_confirmation_code(db: Session) -> str:
    for _ in range(10):
        code = "".join(secrets.choice(_CODE_ALPHABET) for _ in range(8))
        exists = db.scalar(select(Booking.id).where(Booking.confirmation_code == code))
        if not exists:
            return code
    raise RuntimeError("Could not allocate a unique confirmation code.")


def _get_listing_or_404(db: Session, listing_id: int) -> Listing:
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise ListingNotFoundError("That listing could not be found.")
    return listing


def _validate_dates_and_guests(
    listing: Listing, check_in: date, check_out: date, guests: int
) -> None:
    if check_out <= check_in:
        raise ValidationError("Check-out must be after check-in.")
    if nights_between(check_in, check_out) < 1:
        raise ValidationError("A stay must be at least one night.")
    if check_in < date.today():
        raise ValidationError("Check-in cannot be in the past.")
    if guests < 1:
        raise ValidationError("At least one guest is required.")
    if guests > listing.max_guests:
        raise ValidationError(
            f"This place allows at most {listing.max_guests} guests."
        )


def quote(
    db: Session, *, listing_id: int, check_in: date, check_out: date, guests: int
) -> tuple[PriceBreakdown, bool]:
    listing = _get_listing_or_404(db, listing_id)
    _validate_dates_and_guests(listing, check_in, check_out, guests)
    breakdown = calculate_price(
        nightly_rate_cents=listing.nightly_price_cents,
        cleaning_fee_cents=listing.cleaning_fee_cents,
        check_in=check_in,
        check_out=check_out,
    )
    available = availability.is_available(
        db, listing_id=listing_id, check_in=check_in, check_out=check_out
    )
    return breakdown, available


def create_booking(
    db: Session,
    *,
    guest_id: int,
    listing_id: int,
    check_in: date,
    check_out: date,
    guests: int,
) -> Booking:
    """Create a confirmed booking atomically, re-checking conflicts inside the transaction."""
    if db.get_bind().dialect.name == "sqlite":
        # Authentication may already have opened a read transaction. Start a fresh write
        # transaction before reading availability so competing writers cannot both pass.
        db.rollback()
        db.connection().exec_driver_sql("BEGIN IMMEDIATE")
    try:
        return _create_booking_in_transaction(
            db, guest_id=guest_id, listing_id=listing_id,
            check_in=check_in, check_out=check_out, guests=guests,
        )
    except Exception:
        db.rollback()
        raise


def _create_booking_in_transaction(
    db: Session, *, guest_id: int, listing_id: int,
    check_in: date, check_out: date, guests: int,
) -> Booking:
    listing = _get_listing_or_404(db, listing_id)
    _validate_dates_and_guests(listing, check_in, check_out, guests)

    # Authoritative re-check: availability at page-load time may be stale.
    conflicts = availability.find_conflicts(
        db, listing_id=listing_id, check_in=check_in, check_out=check_out
    )
    if conflicts:
        raise BookingConflictError("These dates are no longer available.")

    breakdown = calculate_price(
        nightly_rate_cents=listing.nightly_price_cents,
        cleaning_fee_cents=listing.cleaning_fee_cents,
        check_in=check_in,
        check_out=check_out,
    )

    booking = Booking(
        listing_id=listing_id,
        guest_id=guest_id,
        check_in=check_in,
        check_out=check_out,
        guest_count=guests,
        status=BookingStatus.CONFIRMED,
        nightly_rate_snapshot_cents=breakdown.nightly_rate_cents,
        night_count=breakdown.night_count,
        cleaning_fee_cents=breakdown.cleaning_fee_cents,
        service_fee_cents=breakdown.service_fee_cents,
        taxes_cents=breakdown.taxes_cents,
        total_cents=breakdown.total_cents,
        confirmation_code=_generate_confirmation_code(db),
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def list_trips(db: Session, guest_id: int) -> list[Booking]:
    stmt = (
        select(Booking)
        .where(Booking.guest_id == guest_id)
        .options(
            selectinload(Booking.listing).selectinload(Listing.images),
        )
        .order_by(Booking.check_in.desc())
    )
    return list(db.scalars(stmt).unique().all())


def cancel_booking(db: Session, *, booking_id: int, user_id: int) -> Booking:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise NotFoundError("Booking not found.")
    if booking.guest_id != user_id:
        raise ForbiddenError("You can only cancel your own bookings.")
    if booking.status == BookingStatus.CANCELLED:
        return booking
    # StayFinder's cancellation policy: free cancellation up until the check-in date.
    if booking.check_in <= date.today():
        raise ValidationError("This reservation can no longer be cancelled (check-in has passed).")
    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)
    return booking


def get_trip_detail(db: Session, *, booking_id: int, user_id: int) -> Booking:
    """A booking's full details, for the guest who booked it or the host of its listing."""
    booking = db.scalar(
        select(Booking)
        .where(Booking.id == booking_id)
        .options(
            selectinload(Booking.listing).selectinload(Listing.images),
            selectinload(Booking.listing).selectinload(Listing.host),
            selectinload(Booking.guest),
        )
    )
    if booking is None:
        raise NotFoundError("Reservation not found.")
    if booking.guest_id != user_id and booking.listing.host_id != user_id:
        raise ForbiddenError("You don't have access to this reservation.")
    return booking
