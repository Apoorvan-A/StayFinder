from datetime import date

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.deps import DbSession, OptionalUser
from app.models import Amenity, Listing
from app.schemas.common import Page
from app.schemas.listing import AmenityOut, AvailabilityOut, BookedRange, ListingCard, ListingDetail
from app.schemas.review import ReviewOut, ReviewSummary
from app.serializers import to_card, to_cards, to_detail
from app.services import availability as availability_service
from app.services import listing_service, review_service
from app.services.listing_service import ListingQuery, favorited_listing_ids

router = APIRouter(tags=["listings"])


@router.get("/categories", response_model=list[str])
def categories(db: DbSession) -> list[str]:
    rows = db.scalars(select(Listing.category).distinct().order_by(Listing.category)).all()
    return list(rows)


@router.get("/amenities", response_model=list[AmenityOut])
def amenities(db: DbSession) -> list[Amenity]:
    return list(db.scalars(select(Amenity).order_by(Amenity.category, Amenity.name)).all())


@router.get("/listings", response_model=Page[ListingCard])
def list_listings(
    db: DbSession,
    user: OptionalUser,
    location: str | None = None,
    check_in: date | None = None,
    check_out: date | None = None,
    guests: int | None = Query(default=None, ge=1),
    min_price: int | None = Query(default=None, ge=0, description="Min nightly price in cents"),
    max_price: int | None = Query(default=None, ge=0, description="Max nightly price in cents"),
    property_type: str | None = None,
    category: str | None = None,
    amenities: list[int] | None = Query(default=None),
    bedrooms: int | None = Query(default=None, ge=0),
    beds: int | None = Query(default=None, ge=0),
    min_rating: float | None = Query(default=None, ge=0, le=5),
    sort: str = "recommended",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=18, ge=1, le=48),
) -> Page[ListingCard]:
    query = ListingQuery(
        location=location,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        min_price_cents=min_price,
        max_price_cents=max_price,
        property_type=property_type,
        category=category,
        amenity_ids=amenities or [],
        bedrooms=bedrooms,
        beds=beds,
        min_rating=min_rating,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    items, total = listing_service.search_listings(db, query)
    fav_ids = favorited_listing_ids(db, user.id if user else None)
    total_pages = (total + page_size - 1) // page_size if page_size else 0
    return Page[ListingCard](
        items=to_cards(items, fav_ids),
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )


@router.get("/listings/{listing_id}", response_model=ListingDetail)
def get_listing(listing_id: int, db: DbSession, user: OptionalUser) -> ListingDetail:
    listing = listing_service.get_listing(db, listing_id)
    fav_ids = favorited_listing_ids(db, user.id if user else None)
    return to_detail(listing, fav_ids)


@router.get("/listings/{listing_id}/availability", response_model=AvailabilityOut)
def get_availability(listing_id: int, db: DbSession) -> AvailabilityOut:
    listing_service.get_listing(db, listing_id)  # 404 if missing
    bookings = availability_service.booked_ranges(db, listing_id=listing_id, from_date=date.today())
    return AvailabilityOut(
        listing_id=listing_id,
        booked_ranges=[
            BookedRange(check_in=b.check_in, check_out=b.check_out) for b in bookings
        ],
    )


@router.get("/listings/{listing_id}/reviews", response_model=ReviewSummary)
def get_reviews(listing_id: int, db: DbSession) -> ReviewSummary:
    listing = listing_service.get_listing(db, listing_id)
    reviews = review_service.list_reviews(db, listing_id)
    return ReviewSummary(
        rating=listing.rating,
        review_count=listing.review_count,
        reviews=[ReviewOut.model_validate(r) for r in reviews],
    )
