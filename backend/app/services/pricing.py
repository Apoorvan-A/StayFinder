"""Deterministic, server-authoritative price calculation (all values in cents)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

# Guest-facing service fee and tax rates, applied as integer cent math.
SERVICE_FEE_RATE = 0.14
TAX_RATE = 0.08


@dataclass(frozen=True)
class PriceBreakdown:
    nightly_rate_cents: int
    night_count: int
    accommodation_cents: int
    cleaning_fee_cents: int
    service_fee_cents: int
    taxes_cents: int
    total_cents: int


def nights_between(check_in: date, check_out: date) -> int:
    """Number of nights for a half-open [check_in, check_out) interval."""
    return (check_out - check_in).days


def calculate_price(
    *, nightly_rate_cents: int, cleaning_fee_cents: int, check_in: date, check_out: date
) -> PriceBreakdown:
    night_count = nights_between(check_in, check_out)
    accommodation = nightly_rate_cents * night_count
    service_fee = round(accommodation * SERVICE_FEE_RATE)
    taxes = round((accommodation + cleaning_fee_cents) * TAX_RATE)
    total = accommodation + cleaning_fee_cents + service_fee + taxes
    return PriceBreakdown(
        nightly_rate_cents=nightly_rate_cents,
        night_count=night_count,
        accommodation_cents=accommodation,
        cleaning_fee_cents=cleaning_fee_cents,
        service_fee_cents=service_fee,
        taxes_cents=taxes,
        total_cents=total,
    )
