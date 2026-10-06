from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.listing import ListingCard
from app.schemas.user import UserPublic


class QuoteRequest(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int = 1


class PriceBreakdown(BaseModel):
    nightly_rate_cents: int
    night_count: int
    accommodation_cents: int  # nightly_rate * nights
    cleaning_fee_cents: int
    service_fee_cents: int
    taxes_cents: int
    total_cents: int


class QuoteResponse(PriceBreakdown):
    listing_id: int
    check_in: date
    check_out: date
    guests: int
    available: bool


class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int = 1


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    guest_id: int
    check_in: date
    check_out: date
    guest_count: int
    status: str
    nightly_rate_snapshot_cents: int
    night_count: int
    cleaning_fee_cents: int
    service_fee_cents: int
    taxes_cents: int
    total_cents: int
    confirmation_code: str
    created_at: datetime


class TripOut(BookingOut):
    """A booking enriched with its listing card for the My Trips view."""

    listing: ListingCard


class HostReservationOut(BookingOut):
    listing: ListingCard
    guest: UserPublic


class TripDetail(BookingOut):
    """Full reservation details for a participant (guest or host of the booking)."""

    listing: ListingCard
    host: UserPublic
    guest: UserPublic
    viewer_role: str  # "guest" or "host"
    nights: int
    # Exact address + map coordinates are only populated for confirmed reservations.
    exact_address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
