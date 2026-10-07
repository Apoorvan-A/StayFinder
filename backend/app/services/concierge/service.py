"""Concierge orchestration: natural language → structured intent → real StayFinder search.

The LLM (when configured) only produces a candidate SearchIntent; this module validates and
grounds it in the real inventory vocabulary and then runs the existing listing search service,
so every listing shown is real and availability-aware.
"""

from __future__ import annotations

from urllib.parse import urlencode

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Amenity, Listing
from app.schemas.concierge import ConciergeResponse, SearchIntent
from app.serializers import to_cards
from app.services.concierge import fallback
from app.services.concierge.provider import get_provider
from app.services.listing_service import ListingQuery, search_listings

_CONCIERGE_LIMIT = 6
_ALLOWED_SORT = {"recommended", "price_asc", "price_desc", "rating"}


def _vocab(db: Session) -> dict[str, list[str]]:
    distinct = lambda col: list(db.scalars(select(col).distinct()).all())  # noqa: E731
    return {
        "cities": distinct(Listing.city),
        "countries": distinct(Listing.country),
        "categories": distinct(Listing.category),
        "property_types": distinct(Listing.property_type),
        "amenity_names": [a.name for a in db.scalars(select(Amenity)).all()],
    }


def _parse(db: Session, message: str, vocab: dict[str, list[str]]) -> SearchIntent:
    provider = get_provider()
    if provider is not None:
        try:
            raw = provider.extract_intent(message)
            if isinstance(raw, dict):
                allowed = set(SearchIntent.model_fields)
                return SearchIntent(**{k: v for k, v in raw.items() if k in allowed})
        except Exception:  # noqa: BLE001 — any provider/validation failure → deterministic fallback
            pass
    return fallback.parse(message, **vocab)


def _ground(intent: SearchIntent, db: Session, vocab: dict[str, list[str]]) -> list[int]:
    """Sanitize model-supplied values against real inventory; return amenity ids."""
    # Property type / category must exist, else drop (never invent a filter).
    if intent.property_type:
        match = next((p for p in vocab["property_types"] if p.lower() == intent.property_type.lower()), None)
        intent.property_type = match
    if intent.category:
        match = next((c for c in vocab["categories"] if c.lower() == intent.category.lower()), None)
        intent.category = match
    if intent.sort not in _ALLOWED_SORT:
        intent.sort = None
    # Dates only make sense as a valid future-ish range.
    if intent.check_in and intent.check_out and intent.check_out <= intent.check_in:
        intent.check_in = intent.check_out = None

    amenity_ids: list[int] = []
    if intent.amenities:
        rows = db.scalars(select(Amenity)).all()
        wanted = [a.lower() for a in intent.amenities]
        for amenity in rows:
            if any(w == amenity.name.lower() or w in amenity.name.lower() for w in wanted):
                amenity_ids.append(amenity.id)
    return amenity_ids


def _interpretation(intent: SearchIntent) -> str:
    if intent.category:
        subject = f"{intent.category.lower()} stays"
    elif intent.property_type:
        subject = f"{intent.property_type.lower()}s"
    else:
        subject = "stays"
    s = f"Here are {subject}"
    if intent.location:
        s += f" in {intent.location}"
    if intent.guests:
        s += f" for {intent.guests} guests"
    if intent.max_price_cents and intent.min_price_cents:
        s += f" between ${intent.min_price_cents // 100}–${intent.max_price_cents // 100}/night"
    elif intent.max_price_cents:
        s += f" under ${intent.max_price_cents // 100}/night"
    elif intent.min_price_cents:
        s += f" over ${intent.min_price_cents // 100}/night"
    if intent.amenities:
        s += f" with {', '.join(intent.amenities[:3]).lower()}"
    return s + "."


def _query_string(intent: SearchIntent, amenity_ids: list[int]) -> str:
    params: list[tuple[str, str]] = []
    if intent.location:
        params.append(("location", intent.location))
    if intent.check_in and intent.check_out:
        params.append(("check_in", intent.check_in.isoformat()))
        params.append(("check_out", intent.check_out.isoformat()))
    if intent.guests:
        params.append(("guests", str(intent.guests)))
    if intent.min_price_cents:
        params.append(("min_price", str(intent.min_price_cents)))
    if intent.max_price_cents:
        params.append(("max_price", str(intent.max_price_cents)))
    if intent.property_type:
        params.append(("property_type", intent.property_type))
    if intent.category:
        params.append(("category", intent.category))
    if intent.bedrooms:
        params.append(("bedrooms", str(intent.bedrooms)))
    if intent.beds:
        params.append(("beds", str(intent.beds)))
    if amenity_ids:
        params.append(("amenities", ",".join(str(i) for i in amenity_ids)))
    if intent.sort:
        params.append(("sort", intent.sort))
    return urlencode(params)


def run(db: Session, message: str) -> ConciergeResponse:
    vocab = _vocab(db)
    intent = _parse(db, message, vocab)
    amenity_ids = _ground(intent, db, vocab)

    query = ListingQuery(
        location=intent.location,
        check_in=intent.check_in,
        check_out=intent.check_out,
        guests=intent.guests,
        min_price_cents=intent.min_price_cents,
        max_price_cents=intent.max_price_cents,
        property_type=intent.property_type,
        category=intent.category,
        amenity_ids=amenity_ids,
        bedrooms=intent.bedrooms,
        beds=intent.beds,
        sort=intent.sort or "recommended",
        page=1,
        page_size=_CONCIERGE_LIMIT,
    )
    listings, total = search_listings(db, query)

    has_criteria = any(
        [
            intent.location,
            intent.max_price_cents,
            intent.min_price_cents,
            intent.guests,
            intent.property_type,
            intent.category,
            intent.amenities,
            intent.bedrooms,
        ]
    )
    clarify = None
    if not has_criteria:
        clarify = "Tell me a destination, a budget, or a vibe (like beachfront or a cabin) and I'll narrow it down."
        interpretation = "Here are some stays to get you started."
    elif total == 0:
        interpretation = "No stays matched every preference."
    else:
        interpretation = _interpretation(intent)

    return ConciergeResponse(
        interpretation=interpretation,
        clarify=clarify,
        intent=intent,
        listings=to_cards(listings, set()),
        total=total,
        query_string=_query_string(intent, amenity_ids),
    )
