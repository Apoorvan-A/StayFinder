from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.errors import ForbiddenError, ListingNotFoundError
from app.models import Amenity, Booking, BookingStatus, Listing, ListingImage
from app.schemas.listing import ListingCreate, ListingUpdate


def _owned_or_403(db: Session, *, listing_id: int, host_id: int) -> Listing:
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise ListingNotFoundError("That listing could not be found.")
    if listing.host_id != host_id:
        raise ForbiddenError("You can only manage your own listings.")
    return listing


def get_owned_listing(db: Session, *, listing_id: int, host_id: int) -> Listing:
    return _owned_or_403(db, listing_id=listing_id, host_id=host_id)


def list_host_listings(db: Session, host_id: int) -> list[Listing]:
    stmt = (
        select(Listing)
        .where(Listing.host_id == host_id)
        .options(selectinload(Listing.images), selectinload(Listing.amenities))
        .order_by(Listing.created_at.desc())
    )
    return list(db.scalars(stmt).unique().all())


def _set_images(db: Session, listing: Listing, urls: list[str]) -> None:
    listing.images.clear()
    db.flush()
    for i, url in enumerate(urls):
        if url.strip():
            listing.images.append(
                ListingImage(url=url.strip(), sort_order=i, alt_text=listing.title)
            )


def _set_amenities(db: Session, listing: Listing, amenity_ids: list[int]) -> None:
    amenities = (
        list(db.scalars(select(Amenity).where(Amenity.id.in_(amenity_ids))).all())
        if amenity_ids
        else []
    )
    listing.amenities = amenities


def create_listing(db: Session, *, host_id: int, data: ListingCreate) -> Listing:
    listing = Listing(
        host_id=host_id,
        title=data.title,
        description=data.description,
        city=data.city,
        country=data.country,
        address=data.address,
        latitude=data.latitude,
        longitude=data.longitude,
        nightly_price_cents=data.nightly_price_cents,
        cleaning_fee_cents=data.cleaning_fee_cents,
        max_guests=data.max_guests,
        bedrooms=data.bedrooms,
        beds=data.beds,
        bathrooms=data.bathrooms,
        property_type=data.property_type,
        category=data.category,
    )
    db.add(listing)
    db.flush()
    _set_images(db, listing, data.image_urls)
    _set_amenities(db, listing, data.amenity_ids)
    db.commit()
    db.refresh(listing)
    return listing


def update_listing(
    db: Session, *, listing_id: int, host_id: int, data: ListingUpdate
) -> Listing:
    listing = _owned_or_403(db, listing_id=listing_id, host_id=host_id)
    fields = data.model_dump(exclude_unset=True, exclude={"image_urls", "amenity_ids"})
    for key, value in fields.items():
        setattr(listing, key, value)
    if data.image_urls is not None:
        _set_images(db, listing, data.image_urls)
    if data.amenity_ids is not None:
        _set_amenities(db, listing, data.amenity_ids)
    db.commit()
    db.refresh(listing)
    return listing


def delete_listing(db: Session, *, listing_id: int, host_id: int) -> None:
    listing = _owned_or_403(db, listing_id=listing_id, host_id=host_id)
    # Cascades remove images/amenities/bookings/reviews/favorites; no orphans left behind.
    db.delete(listing)
    db.commit()


def host_reservations(db: Session, host_id: int) -> list[Booking]:
    stmt = (
        select(Booking)
        .join(Listing, Listing.id == Booking.listing_id)
        .where(Listing.host_id == host_id)
        .options(
            selectinload(Booking.listing).selectinload(Listing.images),
            selectinload(Booking.guest),
        )
        .order_by(Booking.check_in.desc())
    )
    return list(db.scalars(stmt).unique().all())


def host_metrics(db: Session, host_id: int) -> dict:
    listing_ids = list(
        db.scalars(select(Listing.id).where(Listing.host_id == host_id)).all()
    )
    active_listings = len(listing_ids)

    if not listing_ids:
        return {
            "active_listings": 0,
            "total_reservations": 0,
            "upcoming_reservations": 0,
            "revenue_cents": 0,
            "average_rating": 0.0,
        }

    total_reservations = (
        db.scalar(
            select(func.count(Booking.id))
            .where(Booking.listing_id.in_(listing_ids))
            .where(Booking.status != BookingStatus.CANCELLED)
        )
        or 0
    )
    upcoming = (
        db.scalar(
            select(func.count(Booking.id))
            .where(Booking.listing_id.in_(listing_ids))
            .where(Booking.status == BookingStatus.CONFIRMED)
            .where(Booking.check_in >= date.today())
        )
        or 0
    )
    revenue = (
        db.scalar(
            select(func.coalesce(func.sum(Booking.total_cents), 0))
            .where(Booking.listing_id.in_(listing_ids))
            .where(Booking.status != BookingStatus.CANCELLED)
        )
        or 0
    )
    avg_rating = db.scalar(
        select(func.avg(Listing.rating))
        .where(Listing.id.in_(listing_ids))
        .where(Listing.review_count > 0)
    )

    return {
        "active_listings": active_listings,
        "total_reservations": int(total_reservations),
        "upcoming_reservations": int(upcoming),
        "revenue_cents": int(revenue),
        "average_rating": round(float(avg_rating), 2) if avg_rating else 0.0,
    }
