from fastapi import APIRouter

from app.deps import CurrentUser, DbSession
from app.models import BookingStatus, UserRole
from app.schemas.booking import (
    BookingCreate,
    BookingOut,
    QuoteRequest,
    QuoteResponse,
    TripDetail,
    TripOut,
)
from app.schemas.message import ConversationDetail, MessageCreate, MessageOut
from app.schemas.user import UserPublic
from app.serializers import to_card
from app.services import booking_service, messaging_service
from app.services.listing_service import favorited_listing_ids
from app.services.pricing import nights_between

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


@router.get("/bookings/{booking_id}", response_model=TripDetail)
def booking_detail(booking_id: int, db: DbSession, user: CurrentUser) -> TripDetail:
    booking = booking_service.get_trip_detail(db, booking_id=booking_id, user_id=user.id)
    listing = booking.listing
    viewer_role = UserRole.GUEST if booking.guest_id == user.id else UserRole.HOST
    # Exact address is only disclosed once the reservation is confirmed.
    reveal = booking.status == BookingStatus.CONFIRMED

    base = BookingOut.model_validate(booking)
    return TripDetail(
        **base.model_dump(),
        listing=to_card(listing, set()),
        host=UserPublic.model_validate(listing.host),
        guest=UserPublic.model_validate(booking.guest),
        viewer_role=viewer_role,
        nights=nights_between(booking.check_in, booking.check_out),
        exact_address=listing.address if reveal else None,
        latitude=listing.latitude if reveal else None,
        longitude=listing.longitude if reveal else None,
    )


@router.post("/bookings/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, db: DbSession, user: CurrentUser) -> BookingOut:
    booking = booking_service.cancel_booking(db, booking_id=booking_id, user_id=user.id)
    return BookingOut.model_validate(booking)


@router.post("/bookings/{booking_id}/message", response_model=ConversationDetail, status_code=201)
def message_from_booking(
    booking_id: int, payload: MessageCreate, db: DbSession, user: CurrentUser
) -> ConversationDetail:
    conv = messaging_service.start_from_booking(db, user=user, booking_id=booking_id, body=payload.body)
    counterparty = messaging_service.counterparty_of(conv, user.id)
    viewer_role = UserRole.GUEST if conv.guest_id == user.id else UserRole.HOST
    return ConversationDetail(
        id=conv.id,
        listing=to_card(conv.listing, set()),
        counterparty=UserPublic.model_validate(counterparty),
        viewer_role=viewer_role,
        messages=[MessageOut.model_validate(m) for m in conv.messages],
    )
