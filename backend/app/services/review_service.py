from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import Listing, Review


def list_reviews(db: Session, listing_id: int) -> list[Review]:
    stmt = (
        select(Review)
        .where(Review.listing_id == listing_id)
        .options(selectinload(Review.author))
        .order_by(Review.created_at.desc())
    )
    return list(db.scalars(stmt).unique().all())


def recompute_aggregates(db: Session, listing_id: int) -> None:
    """Recompute a listing's denormalized rating / review_count from its reviews."""
    avg_rating, count = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.listing_id == listing_id
        )
    ).one()
    listing = db.get(Listing, listing_id)
    if listing is not None:
        listing.rating = round(float(avg_rating), 2) if avg_rating is not None else 0.0
        listing.review_count = int(count)
        db.commit()
