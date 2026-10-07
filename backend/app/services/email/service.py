"""Transactional email sending — idempotent, best-effort, and never affects booking success.

Recipient is always the authenticated user's stored email (never a client-supplied address).
Demo accounts are skipped so the demo never emails strangers. Delivery failures are logged and
swallowed: a confirmed booking stays confirmed even if the email provider is down.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Booking
from app.services.email import templates
from app.services.email.provider import get_provider

logger = logging.getLogger("stayfinder.email")


def _deliver(db: Session, booking: Booking, kind: str) -> str:
    guest = booking.guest
    # Never send real mail to the built-in demo identities (fake addresses).
    if guest.provider == "demo":
        logger.info("email skipped (demo account) booking=%s kind=%s", booking.id, kind)
        return "skipped_demo"

    already = booking.confirmation_email_sent_at if kind == "confirmation" else booking.cancellation_email_sent_at
    if already is not None:
        return "already_sent"

    provider = get_provider()
    if provider is None:
        logger.info("email provider unconfigured; skipping booking=%s kind=%s", booking.id, kind)
        return "unconfigured"

    settings = get_settings()
    if kind == "confirmation":
        subject, html, text = templates.build_confirmation(booking, settings.frontend_url)
    else:
        subject, html, text = templates.build_cancellation(booking, settings.frontend_url)

    try:
        provider.send(to=guest.email, subject=subject, html=html, text=text)
    except Exception as exc:  # noqa: BLE001 — delivery failure must not break the booking flow
        logger.warning("email delivery failed booking=%s kind=%s error=%s", booking.id, kind, type(exc).__name__)
        return "failed"

    now = datetime.now(timezone.utc)
    if kind == "confirmation":
        booking.confirmation_email_sent_at = now
    else:
        booking.cancellation_email_sent_at = now
    db.commit()
    logger.info("email sent booking=%s kind=%s", booking.id, kind)
    return "sent"


def send_booking_confirmation(db: Session, booking: Booking) -> str:
    return _deliver(db, booking, "confirmation")


def send_booking_cancellation(db: Session, booking: Booking) -> str:
    return _deliver(db, booking, "cancellation")
