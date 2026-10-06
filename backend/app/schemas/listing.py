from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublic


class ImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    alt_text: str = ""
    sort_order: int = 0


class AmenityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    icon: str
    category: str


class ListingCard(BaseModel):
    """Compact shape for grid/search cards."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    city: str
    country: str
    property_type: str
    category: str
    nightly_price_cents: int
    rating: float
    review_count: int
    is_guest_favorite: bool
    max_guests: int
    bedrooms: int
    beds: int
    latitude: float | None = None
    longitude: float | None = None
    images: list[ImageOut] = Field(default_factory=list)
    is_favorited: bool = False


class ListingDetail(ListingCard):
    description: str
    address: str | None = None
    bathrooms: float
    cleaning_fee_cents: int
    host: UserPublic
    amenities: list[AmenityOut] = Field(default_factory=list)


class ListingCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(default="", max_length=5000)
    city: str = Field(min_length=1, max_length=120)
    country: str = Field(min_length=1, max_length=120)
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    nightly_price_cents: int = Field(ge=0)
    cleaning_fee_cents: int = Field(default=0, ge=0)
    max_guests: int = Field(ge=1, le=50)
    bedrooms: int = Field(ge=0, le=50)
    beds: int = Field(ge=0, le=50)
    bathrooms: float = Field(ge=0, le=50)
    property_type: str = "Apartment"
    category: str = "Trending"
    image_urls: list[str] = Field(default_factory=list)
    amenity_ids: list[int] = Field(default_factory=list)


class ListingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    city: str | None = None
    country: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    nightly_price_cents: int | None = Field(default=None, ge=0)
    cleaning_fee_cents: int | None = Field(default=None, ge=0)
    max_guests: int | None = Field(default=None, ge=1, le=50)
    bedrooms: int | None = Field(default=None, ge=0, le=50)
    beds: int | None = Field(default=None, ge=0, le=50)
    bathrooms: float | None = Field(default=None, ge=0, le=50)
    property_type: str | None = None
    category: str | None = None
    image_urls: list[str] | None = None
    amenity_ids: list[int] | None = None


class BookedRange(BaseModel):
    check_in: date
    check_out: date


class AvailabilityOut(BaseModel):
    listing_id: int
    booked_ranges: list[BookedRange]
