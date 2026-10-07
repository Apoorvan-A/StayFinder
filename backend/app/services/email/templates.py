"""Email-safe HTML + plain-text builders for transactional booking emails."""

from __future__ import annotations

from datetime import date

from app.models import Booking

BRAND = "#E8505B"
CANCELLATION_POLICY = (
    "Free cancellation before check-in. StayFinder is a demo, so no real charges apply."
)


def _fmt_date(d: date) -> str:
    return f"{d.strftime('%b')} {d.day}, {d.year}"


def _money(cents: int) -> str:
    return f"${cents / 100:,.2f}"


def _directions_url(booking: Booking) -> str | None:
    listing = booking.listing
    if listing.latitude is not None and listing.longitude is not None:
        return f"https://www.google.com/maps/dir/?api=1&destination={listing.latitude},{listing.longitude}"
    if listing.address:
        from urllib.parse import quote

        return f"https://www.google.com/maps/dir/?api=1&destination={quote(listing.address)}"
    return None


def _shell(title: str, accent: str, body: str) -> str:
    return f"""\
<!doctype html><html><body style="margin:0;background:#f7f7f7;font-family:Arial,Helvetica,sans-serif;color:#222;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="font-size:22px;font-weight:bold;color:{BRAND};margin-bottom:16px;">StayFinder</div>
    <div style="background:#fff;border:1px solid #eee;border-radius:16px;overflow:hidden;">
      <div style="background:{accent};color:#fff;padding:16px 24px;font-size:16px;font-weight:bold;letter-spacing:.5px;">{title}</div>
      <div style="padding:24px;">{body}</div>
    </div>
    <p style="color:#999;font-size:12px;margin-top:16px;">StayFinder is a demonstration application. This email was sent because a reservation action occurred on your account.</p>
  </div>
</body></html>"""


def _row(label: str, value: str) -> str:
    return (
        f'<tr><td style="padding:4px 0;color:#717171;font-size:14px;">{label}</td>'
        f'<td style="padding:4px 0;text-align:right;font-size:14px;">{value}</td></tr>'
    )


def build_confirmation(booking: Booking, frontend_url: str) -> tuple[str, str, str]:
    listing = booking.listing
    url = f"{frontend_url.rstrip('/')}/trips/{booking.id}"
    directions = _directions_url(booking)
    subject = f"Your StayFinder reservation is confirmed — {listing.title}"

    details = (
        f'<table style="width:100%;border-collapse:collapse;">'
        + _row("Confirmation code", f"<b>{booking.confirmation_code}</b>")
        + _row("Host", listing.host.name)
        + _row("Check-in", _fmt_date(booking.check_in))
        + _row("Checkout", _fmt_date(booking.check_out))
        + _row("Nights", str(booking.night_count))
        + _row("Guests", str(booking.guest_count))
        + "</table>"
    )
    accommodation = booking.nightly_rate_snapshot_cents * booking.night_count
    price = (
        '<table style="width:100%;border-collapse:collapse;margin-top:8px;">'
        + _row(f"{_money(booking.nightly_rate_snapshot_cents)} × {booking.night_count} nights", _money(accommodation))
        + _row("Cleaning fee", _money(booking.cleaning_fee_cents))
        + _row("Service fee", _money(booking.service_fee_cents))
        + _row("Taxes", _money(booking.taxes_cents))
        + f'<tr><td style="padding:10px 0 0;border-top:1px solid #eee;font-weight:bold;">Total (USD)</td>'
        + f'<td style="padding:10px 0 0;border-top:1px solid #eee;text-align:right;font-weight:bold;">{_money(booking.total_cents)}</td></tr>'
        + "</table>"
    )
    location = f'<p style="margin:16px 0 4px;font-weight:bold;">Getting there</p><p style="margin:0;color:#444;">{listing.address or f"{listing.city}, {listing.country}"}</p>'
    if directions:
        location += f'<p style="margin:8px 0 0;"><a href="{directions}" style="color:{BRAND};">Get directions</a></p>'

    cta = f'<a href="{url}" style="display:inline-block;margin-top:20px;background:{BRAND};color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;">View reservation</a>'

    body = (
        f'<h2 style="margin:0 0 4px;font-size:18px;">{listing.title}</h2>'
        f'<p style="margin:0 0 16px;color:#717171;">{listing.city}, {listing.country}</p>'
        f"{details}<hr style='border:none;border-top:1px solid #eee;margin:16px 0;'>{price}{location}"
        f'<p style="margin:16px 0 0;color:#717171;font-size:13px;">{CANCELLATION_POLICY}</p>{cta}'
    )
    html = _shell("BOOKING CONFIRMED", "#1f8a4c", body)

    text = (
        f"Booking confirmed — {listing.title} ({listing.city}, {listing.country})\n"
        f"Confirmation: {booking.confirmation_code}\nHost: {listing.host.name}\n"
        f"Check-in: {_fmt_date(booking.check_in)}  Checkout: {_fmt_date(booking.check_out)} "
        f"({booking.night_count} nights, {booking.guest_count} guests)\n"
        f"Total: {_money(booking.total_cents)}\n"
        f"Address: {listing.address or f'{listing.city}, {listing.country}'}\n"
        + (f"Directions: {directions}\n" if directions else "")
        + f"View reservation: {url}\n{CANCELLATION_POLICY}"
    )
    return subject, html, text


def build_cancellation(booking: Booking, frontend_url: str) -> tuple[str, str, str]:
    listing = booking.listing
    url = f"{frontend_url.rstrip('/')}/trips/{booking.id}"
    subject = f"Your StayFinder reservation was cancelled — {listing.title}"

    details = (
        '<table style="width:100%;border-collapse:collapse;">'
        + _row("Confirmation code", f"<b>{booking.confirmation_code}</b>")
        + _row("Original dates", f"{_fmt_date(booking.check_in)} – {_fmt_date(booking.check_out)}")
        + _row("Guests", str(booking.guest_count))
        + "</table>"
    )
    body = (
        f'<h2 style="margin:0 0 4px;font-size:18px;">{listing.title}</h2>'
        f'<p style="margin:0 0 16px;color:#717171;">{listing.city}, {listing.country}</p>'
        f"{details}"
        f'<p style="margin:16px 0 0;color:#444;">This reservation has been cancelled and those dates are now available again. '
        f"As this is a demo, no charge was made and no refund is required.</p>"
        f'<a href="{url}" style="display:inline-block;margin-top:20px;background:{BRAND};color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;">View in Trips</a>'
    )
    html = _shell("BOOKING CANCELLED", "#6a6a6a", body)
    text = (
        f"Booking cancelled — {listing.title} ({listing.city}, {listing.country})\n"
        f"Confirmation: {booking.confirmation_code}\n"
        f"Original dates: {_fmt_date(booking.check_in)} – {_fmt_date(booking.check_out)}\n"
        f"Those dates are available again. No charge was made.\nView: {url}"
    )
    return subject, html, text
