from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.listing import Listing


class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    # Lucide icon identifier used by the frontend to render a matching glyph.
    icon: Mapped[str] = mapped_column(String(60), default="check", nullable=False)
    category: Mapped[str] = mapped_column(String(60), default="general", nullable=False)

    listings: Mapped[list[Listing]] = relationship(
        secondary="listing_amenities", back_populates="amenities", viewonly=True
    )


class ListingAmenity(Base):
    __tablename__ = "listing_amenities"
    __table_args__ = (UniqueConstraint("listing_id", "amenity_id", name="uq_listing_amenity"),)

    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True
    )
    amenity_id: Mapped[int] = mapped_column(
        ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True
    )
