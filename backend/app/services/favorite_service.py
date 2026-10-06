from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.errors import DuplicateFavoriteError, ListingNotFoundError
from app.models import Favorite, Listing


def list_favorites(db: Session, user_id: int) -> list[Listing]:
    stmt = (
        select(Listing)
        .join(Favorite, Favorite.listing_id == Listing.id)
        .where(Favorite.user_id == user_id)
        .options(selectinload(Listing.images), selectinload(Listing.host))
        .order_by(Favorite.created_at.desc())
    )
    return list(db.scalars(stmt).unique().all())


def add_favorite(db: Session, *, user_id: int, listing_id: int) -> None:
    if db.get(Listing, listing_id) is None:
        raise ListingNotFoundError("That listing could not be found.")
    existing = db.scalar(
        select(Favorite).where(
            Favorite.user_id == user_id, Favorite.listing_id == listing_id
        )
    )
    if existing is not None:
        raise DuplicateFavoriteError("This listing is already in your wishlist.")
    db.add(Favorite(user_id=user_id, listing_id=listing_id))
    db.commit()


def remove_favorite(db: Session, *, user_id: int, listing_id: int) -> None:
    existing = db.scalar(
        select(Favorite).where(
            Favorite.user_id == user_id, Favorite.listing_id == listing_id
        )
    )
    if existing is not None:
        db.delete(existing)
        db.commit()
