from fastapi import APIRouter

from app.deps import CurrentUser, DbSession
from app.schemas.common import MessageResponse
from app.schemas.listing import ListingCard
from app.serializers import to_cards
from app.services import favorite_service

router = APIRouter(tags=["favorites"])


@router.get("/favorites", response_model=list[ListingCard])
def list_favorites(db: DbSession, user: CurrentUser) -> list[ListingCard]:
    listings = favorite_service.list_favorites(db, user.id)
    fav_ids = {listing.id for listing in listings}
    return to_cards(listings, fav_ids)


@router.post("/favorites/{listing_id}", response_model=MessageResponse, status_code=201)
def add_favorite(listing_id: int, db: DbSession, user: CurrentUser) -> MessageResponse:
    favorite_service.add_favorite(db, user_id=user.id, listing_id=listing_id)
    return MessageResponse(message="Added to wishlist.")


@router.delete("/favorites/{listing_id}", response_model=MessageResponse)
def remove_favorite(listing_id: int, db: DbSession, user: CurrentUser) -> MessageResponse:
    favorite_service.remove_favorite(db, user_id=user.id, listing_id=listing_id)
    return MessageResponse(message="Removed from wishlist.")
