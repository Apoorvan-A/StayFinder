"""Helpers to turn ORM objects into response schemas, annotating per-user flags."""

from __future__ import annotations

from app.models import Listing
from app.schemas.listing import HostListingDetail, ListingCard, ListingDetail


def to_card(listing: Listing, favorited_ids: set[int]) -> ListingCard:
    card = ListingCard.model_validate(listing)
    card.is_favorited = listing.id in favorited_ids
    return card


def to_cards(listings: list[Listing], favorited_ids: set[int]) -> list[ListingCard]:
    return [to_card(listing, favorited_ids) for listing in listings]


def to_detail(listing: Listing, favorited_ids: set[int]) -> ListingDetail:
    detail = ListingDetail.model_validate(listing)
    detail.is_favorited = listing.id in favorited_ids
    return detail


def to_host_detail(listing: Listing) -> HostListingDetail:
    """Host-facing serialization that includes the exact address for editing."""
    return HostListingDetail.model_validate(listing)
