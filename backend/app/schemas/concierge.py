from datetime import date

from pydantic import BaseModel, Field

from app.schemas.listing import ListingCard


class SearchIntent(BaseModel):
    """Structured search criteria parsed from a natural-language concierge request.

    Every field maps to a real StayFinder filter — the model never invents data, and the
    backend search service remains authoritative for the listings returned.
    """

    location: str | None = None
    check_in: date | None = None
    check_out: date | None = None
    guests: int | None = Field(default=None, ge=1, le=50)
    min_price_cents: int | None = Field(default=None, ge=0)
    max_price_cents: int | None = Field(default=None, ge=0)
    property_type: str | None = None
    category: str | None = None
    bedrooms: int | None = Field(default=None, ge=0, le=50)
    beds: int | None = Field(default=None, ge=0, le=50)
    amenities: list[str] = Field(default_factory=list)
    sort: str | None = None


class ConciergeRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)


class ConciergeResponse(BaseModel):
    interpretation: str
    clarify: str | None = None
    intent: SearchIntent
    listings: list[ListingCard]
    total: int
    # Query string (no leading '?') to open the same search in the normal Explore page.
    query_string: str
