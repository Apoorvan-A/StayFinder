from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.amenity import Amenity
    from app.models.booking import Booking
    from app.models.favorite import Favorite
    from app.models.review import Review
    from app.models.user import User


class ListingImage(Base):
    __tablename__ = "listing_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(String(600), nullable=False)
    alt_text: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    listing: Mapped[Listing] = relationship(back_populates="images")


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = (
        CheckConstraint("nightly_price_cents >= 0", name="ck_listing_price_nonneg"),
        CheckConstraint("max_guests >= 1", name="ck_listing_guests_min"),
        Index("ix_listings_city", "city"),
        Index("ix_listings_price", "nightly_price_cents"),
        Index("ix_listings_property_type", "property_type"),
        Index("ix_listings_category", "category"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)

    # Location
    address: Mapped[str | None] = mapped_column(String(300))
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)

    # Pricing — integer minor units (cents)
    nightly_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    cleaning_fee_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Capacity
    max_guests: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    bedrooms: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    beds: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    bathrooms: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    property_type: Mapped[str] = mapped_column(String(60), default="Apartment", nullable=False)
    category: Mapped[str] = mapped_column(String(60), default="Trending", nullable=False)

    # Derived aggregates, recomputed from reviews.
    rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    is_guest_favorite: Mapped[bool] = mapped_column(default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    host: Mapped[User] = relationship(back_populates="listings")
    images: Mapped[list[ListingImage]] = relationship(
        back_populates="listing",
        cascade="all, delete-orphan",
        order_by="ListingImage.sort_order",
    )
    amenities: Mapped[list[Amenity]] = relationship(
        secondary="listing_amenities", back_populates="listings"
    )
    bookings: Mapped[list[Booking]] = relationship(
        back_populates="listing", cascade="all, delete-orphan"
    )
    reviews: Mapped[list[Review]] = relationship(
        back_populates="listing", cascade="all, delete-orphan"
    )
    favorites: Mapped[list[Favorite]] = relationship(
        back_populates="listing", cascade="all, delete-orphan"
    )
