from fastapi import APIRouter

from app.deps import CurrentUser, DbSession
from app.schemas.booking import (
    BookingCreate,
    BookingOut,
    QuoteRequest,
    QuoteResponse,
    TripOut,
)
from app.serializers import to_card
from app.services import booking_service
from app.services.listing_service import favorited_listing_ids

router = APIRouter(tags=["bookings"])


@router.post("/bookings/quote", response_model=QuoteResponse)
def quote(payload: QuoteRequest, db: DbSession) -> QuoteResponse:
    breakdown, available = booking_service.quote(
        db,
        listing_id=payload.listing_id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        guests=payload.guests,
    )
    return QuoteResponse(
        listing_id=payload.listing_id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        guests=payload.guests,
        available=available,
        **breakdown.__dict__,
    )


@router.post("/bookings", response_model=BookingOut, status_code=201)
def create_booking(payload: BookingCreate, db: DbSession, user: CurrentUser) -> BookingOut:
    booking = booking_service.create_booking(
        db,
        guest_id=user.id,
        listing_id=payload.listing_id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        guests=payload.guests,
    )
    return BookingOut.model_validate(booking)


@router.get("/trips", response_model=list[TripOut])
def trips(db: DbSession, user: CurrentUser) -> list[TripOut]:
    bookings = booking_service.list_trips(db, user.id)
    fav_ids = favorited_listing_ids(db, user.id)
    result: list[TripOut] = []
    for b in bookings:
        trip = TripOut.model_validate(b, from_attributes=True)
        trip.listing = to_card(b.listing, fav_ids)
        result.append(trip)
    return result


@router.post("/bookings/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, db: DbSession, user: CurrentUser) -> BookingOut:
    booking = booking_service.cancel_booking(db, booking_id=booking_id, user_id=user.id)
    return BookingOut.model_validate(booking)
