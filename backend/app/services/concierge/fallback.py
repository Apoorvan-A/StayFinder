"""Deterministic natural-language parser used when no AI provider is configured.

Keyword/regex based — intentionally small, not a homemade NLP engine. It grounds location,
property type, category and amenities in the real inventory vocabulary passed in, so it can
never invent values the backend doesn't support.
"""

from __future__ import annotations

import re

from app.schemas.concierge import SearchIntent

_CATEGORY_KEYWORDS = {
    "beachfront": "Beachfront",
    "beach": "Beachfront",
    "lakefront": "Lakefront",
    "lake": "Lakefront",
    "luxe": "Luxe",
    "luxury": "Luxe",
    "countryside": "Countryside",
    "rural": "Countryside",
    "tropical": "Tropical",
    "design": "Design",
    "city": "City",
    "urban": "City",
    "views": "Amazing views",
    "view": "Amazing views",
    "cabins": "Cabins",
}

_AMENITY_KEYWORDS = {
    "pool": "Pool",
    "wifi": "Wifi",
    "wi-fi": "Wifi",
    "hot tub": "Hot tub",
    "jacuzzi": "Hot tub",
    "parking": "Free parking",
    "kitchen": "Kitchen",
    "gym": "Gym",
    "pet": "Pets allowed",
    "dog": "Pets allowed",
    "fireplace": "Fireplace",
    "ocean view": "Ocean view",
    "air conditioning": "Air conditioning",
    "a/c": "Air conditioning",
    "ac": "Air conditioning",
    "ev charger": "EV charger",
    "beach access": "Beach access",
    "mountain view": "Mountain view",
    "bbq": "BBQ grill",
    "workspace": "Workspace",
}


def _match_vocab(text: str, vocab: list[str]) -> str | None:
    """Return the longest vocabulary entry that appears as a word/phrase in text."""
    best: str | None = None
    for item in vocab:
        if re.search(rf"\b{re.escape(item.lower())}\b", text):
            if best is None or len(item) > len(best):
                best = item
    return best


def parse(
    message: str,
    *,
    cities: list[str],
    countries: list[str],
    categories: list[str],
    property_types: list[str],
    amenity_names: list[str],
) -> SearchIntent:
    text = f" {message.lower()} "
    intent = SearchIntent()

    # Location — prefer a city match, else a country.
    intent.location = _match_vocab(text, cities) or _match_vocab(text, countries)

    # Price
    m = re.search(r"(?:under|below|less than|up to|max(?:imum)?)\s*\$?\s*(\d{2,6})", text)
    if m:
        intent.max_price_cents = int(m.group(1)) * 100
    m = re.search(r"(?:over|above|more than|from|min(?:imum)?)\s*\$?\s*(\d{2,6})", text)
    if m:
        intent.min_price_cents = int(m.group(1)) * 100

    # Guests
    m = re.search(r"(?:for|sleeps?|party of)\s+(\d{1,2})", text) or re.search(
        r"(\d{1,2})\s*(?:guests?|people|adults|travellers?|travelers?)", text
    )
    if m:
        intent.guests = min(50, max(1, int(m.group(1))))

    # Bedrooms
    m = re.search(r"(\d{1,2})\s*(?:bed\s?rooms?|bedroom|br\b)", text)
    if m:
        intent.bedrooms = int(m.group(1))

    # Property type (grounded in real inventory)
    pt = _match_vocab(text, property_types)
    if pt is None:
        for kw, value in {"flat": "Apartment", "home": "House"}.items():
            if re.search(rf"\b{kw}\b", text) and value in property_types:
                pt = value
                break
    intent.property_type = pt

    # Category
    for kw, value in _CATEGORY_KEYWORDS.items():
        if re.search(rf"\b{re.escape(kw)}\b", text) and value in categories:
            intent.category = value
            break

    # Amenities — word-boundary match so short keywords (e.g. "ac") don't match inside
    # other words (e.g. "beach").
    found: list[str] = []
    valid = {a.lower() for a in amenity_names}
    for kw, value in _AMENITY_KEYWORDS.items():
        if re.search(rf"(?<!\w){re.escape(kw)}(?!\w)", text) and value.lower() in valid and value not in found:
            found.append(value)
    intent.amenities = found

    # Sort preference
    if re.search(r"\b(cheap|cheapest|budget|affordable)\b", text):
        intent.sort = "price_asc"
    elif re.search(r"\b(top rated|best rated|highest rated|best reviewed)\b", text):
        intent.sort = "rating"

    return intent
