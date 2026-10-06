from fastapi import APIRouter
from pydantic import BaseModel

from app.deps import CurrentUser, DbSession
from app.schemas.booking import HostReservationOut
from app.schemas.common import MessageResponse
from app.schemas.listing import HostListingDetail, ListingCreate, ListingUpdate
from app.serializers import to_card, to_host_detail
from app.services import host_service

router = APIRouter(prefix="/host", tags=["host"])


class HostMetrics(BaseModel):
    active_listings: int
    total_reservations: int
    upcoming_reservations: int
    revenue_cents: int
    average_rating: float


@router.get("/metrics", response_model=HostMetrics)
def metrics(db: DbSession, user: CurrentUser) -> HostMetrics:
    return HostMetrics(**host_service.host_metrics(db, user.id))


@router.get("/listings", response_model=list[HostListingDetail])
def list_listings(db: DbSession, user: CurrentUser) -> list[HostListingDetail]:
    listings = host_service.list_host_listings(db, user.id)
    return [to_host_detail(listing) for listing in listings]


@router.get("/listings/{listing_id}", response_model=HostListingDetail)
def get_listing(listing_id: int, db: DbSession, user: CurrentUser) -> HostListingDetail:
    listing = host_service.get_owned_listing(db, listing_id=listing_id, host_id=user.id)
    return to_host_detail(listing)


@router.post("/listings", response_model=HostListingDetail, status_code=201)
def create_listing(payload: ListingCreate, db: DbSession, user: CurrentUser) -> HostListingDetail:
    listing = host_service.create_listing(db, host_id=user.id, data=payload)
    return to_host_detail(listing)


@router.patch("/listings/{listing_id}", response_model=HostListingDetail)
def update_listing(
    listing_id: int, payload: ListingUpdate, db: DbSession, user: CurrentUser
) -> HostListingDetail:
    listing = host_service.update_listing(
        db, listing_id=listing_id, host_id=user.id, data=payload
    )
    return to_host_detail(listing)


@router.delete("/listings/{listing_id}", response_model=MessageResponse)
def delete_listing(listing_id: int, db: DbSession, user: CurrentUser) -> MessageResponse:
    host_service.delete_listing(db, listing_id=listing_id, host_id=user.id)
    return MessageResponse(message="Listing deleted.")


@router.get("/reservations", response_model=list[HostReservationOut])
def reservations(db: DbSession, user: CurrentUser) -> list[HostReservationOut]:
    bookings = host_service.host_reservations(db, user.id)
    result: list[HostReservationOut] = []
    for b in bookings:
        row = HostReservationOut.model_validate(b, from_attributes=True)
        row.listing = to_card(b.listing, set())
        result.append(row)
    return result
