from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.errors import ListingNotFoundError
from app.models import Booking, BookingStatus, Listing, ListingAmenity
from app.services.availability import _overlap_clause


@dataclass
class ListingQuery:
    location: str | None = None
    check_in: date | None = None
    check_out: date | None = None
    guests: int | None = None
    min_price_cents: int | None = None
    max_price_cents: int | None = None
    property_type: str | None = None
    category: str | None = None
    amenity_ids: list[int] = field(default_factory=list)
    bedrooms: int | None = None
    beds: int | None = None
    min_rating: float | None = None
    sort: str = "recommended"
    page: int = 1
    page_size: int = 18


_EAGER = (
    selectinload(Listing.images),
    selectinload(Listing.amenities),
    selectinload(Listing.host),
)


def _apply_filters(stmt, q: ListingQuery):
    if q.location:
        like = f"%{q.location.strip()}%"
        stmt = stmt.where(
            or_(
                Listing.city.ilike(like),
                Listing.country.ilike(like),
                Listing.title.ilike(like),
            )
        )
    if q.guests:
        stmt = stmt.where(Listing.max_guests >= q.guests)
    if q.min_price_cents is not None:
        stmt = stmt.where(Listing.nightly_price_cents >= q.min_price_cents)
    if q.max_price_cents is not None:
        stmt = stmt.where(Listing.nightly_price_cents <= q.max_price_cents)
    if q.property_type:
        stmt = stmt.where(Listing.property_type == q.property_type)
    if q.category and q.category.lower() != "all":
        stmt = stmt.where(Listing.category == q.category)
    if q.bedrooms:
        stmt = stmt.where(Listing.bedrooms >= q.bedrooms)
    if q.beds:
        stmt = stmt.where(Listing.beds >= q.beds)
    if q.min_rating is not None:
        stmt = stmt.where(Listing.rating >= q.min_rating)

    for amenity_id in q.amenity_ids:
        # Each amenity must be present → correlated EXISTS per required amenity.
        stmt = stmt.where(
            select(ListingAmenity.listing_id)
            .where(ListingAmenity.listing_id == Listing.id)
            .where(ListingAmenity.amenity_id == amenity_id)
            .exists()
        )

    if q.check_in and q.check_out and q.check_out > q.check_in:
        conflict_exists = (
            select(Booking.id)
            .where(Booking.listing_id == Listing.id)
            .where(Booking.status.in_(BookingStatus.BLOCKING))
            .where(_overlap_clause(q.check_in, q.check_out))
            .exists()
        )
        stmt = stmt.where(~conflict_exists)
    return stmt


def _apply_sort(stmt, sort: str):
    if sort == "price_asc":
        return stmt.order_by(Listing.nightly_price_cents.asc(), Listing.id.asc())
    if sort == "price_desc":
        return stmt.order_by(Listing.nightly_price_cents.desc(), Listing.id.asc())
    if sort == "rating":
        return stmt.order_by(Listing.rating.desc(), Listing.review_count.desc(), Listing.id.asc())
    # "recommended": guest favorites + rating, stable by id.
    return stmt.order_by(
        Listing.is_guest_favorite.desc(), Listing.rating.desc(), Listing.id.asc()
    )


def search_listings(db: Session, q: ListingQuery) -> tuple[list[Listing], int]:
    base = _apply_filters(select(Listing), q)

    count_stmt = _apply_filters(select(func.count(Listing.id)), q)
    total = db.scalar(count_stmt) or 0

    page = max(1, q.page)
    page_size = max(1, min(q.page_size, 48))
    stmt = _apply_sort(base, q.sort).options(*_EAGER)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    items = list(db.scalars(stmt).unique().all())
    return items, total


def get_listing(db: Session, listing_id: int) -> Listing:
    stmt = select(Listing).where(Listing.id == listing_id).options(*_EAGER)
    listing = db.scalars(stmt).unique().one_or_none()
    if listing is None:
        raise ListingNotFoundError("That listing could not be found.")
    return listing


def favorited_listing_ids(db: Session, user_id: int | None) -> set[int]:
    if not user_id:
        return set()
    from app.models import Favorite

    rows = db.scalars(select(Favorite.listing_id).where(Favorite.user_id == user_id)).all()
    return set(rows)
