from datetime import date, timedelta

from app.models import Booking, User, UserRole
from app.services.email import service as email_service
from tests.conftest import auth


def iso(n):
    return (date.today() + timedelta(days=n)).isoformat()


class FakeProvider:
    def __init__(self, fail=False):
        self.sent = []
        self.fail = fail

    def send(self, *, to, subject, html, text):
        if self.fail:
            raise RuntimeError("provider down")
        self.sent.append({"to": to, "subject": subject, "html": html})
        return True


def _google_user(db, email="real.guest@gmail.com", sub="google-sub-1"):
    u = User(name="Real Guest", email=email, role=UserRole.GUEST, provider="google", provider_subject_id=sub)
    db.add(u)
    db.commit()
    return u


def _book(client, user_id, listing_id, ci=10, co=13):
    return client.post(
        "/api/bookings",
        json={"listing_id": listing_id, "check_in": iso(ci), "check_out": iso(co), "guests": 2},
        cookies=auth(user_id),
    )


def test_confirmed_booking_emails_authenticated_user(client, seeded, db_session, monkeypatch):
    user = _google_user(db_session)
    fake = FakeProvider()
    monkeypatch.setattr(email_service, "get_provider", lambda: fake)

    res = _book(client, user.id, seeded["listing"])
    assert res.status_code == 201
    assert len(fake.sent) == 1
    # Recipient comes from the authenticated identity, never the request body.
    assert fake.sent[0]["to"] == "real.guest@gmail.com"
    assert "confirmed" in fake.sent[0]["subject"].lower()
    booking = db_session.get(Booking, res.json()["id"])
    assert booking.confirmation_email_sent_at is not None


def test_demo_account_sends_no_external_email(client, seeded, monkeypatch):
    fake = FakeProvider()
    monkeypatch.setattr(email_service, "get_provider", lambda: fake)
    # seeded["guest"] is a demo account (provider == "demo").
    res = _book(client, seeded["guest"], seeded["listing"])
    assert res.status_code == 201
    assert fake.sent == []


def test_email_failure_does_not_rollback_booking(client, seeded, db_session, monkeypatch):
    user = _google_user(db_session)
    monkeypatch.setattr(email_service, "get_provider", lambda: FakeProvider(fail=True))
    res = _book(client, user.id, seeded["listing"])
    assert res.status_code == 201  # booking still confirmed despite email failure
    assert db_session.get(Booking, res.json()["id"]).status == "confirmed"


def test_confirmation_email_is_idempotent(client, seeded, db_session, monkeypatch):
    user = _google_user(db_session)
    fake = FakeProvider()
    monkeypatch.setattr(email_service, "get_provider", lambda: fake)
    booking = db_session.get(Booking, _book(client, user.id, seeded["listing"]).json()["id"])
    assert len(fake.sent) == 1
    # A repeat send (e.g. retried request) does not send a second email.
    assert email_service.send_booking_confirmation(db_session, booking) == "already_sent"
    assert len(fake.sent) == 1


def test_cancellation_sends_email(client, seeded, db_session, monkeypatch):
    user = _google_user(db_session)
    fake = FakeProvider()
    monkeypatch.setattr(email_service, "get_provider", lambda: fake)
    booking_id = _book(client, user.id, seeded["listing"]).json()["id"]
    client.post(f"/api/bookings/{booking_id}/cancel", cookies=auth(user.id))
    cancels = [s for s in fake.sent if "cancelled" in s["subject"].lower()]
    assert len(cancels) == 1


def test_repeated_cancel_no_duplicate_email(client, seeded, db_session, monkeypatch):
    user = _google_user(db_session)
    fake = FakeProvider()
    monkeypatch.setattr(email_service, "get_provider", lambda: fake)
    booking_id = _book(client, user.id, seeded["listing"]).json()["id"]
    client.post(f"/api/bookings/{booking_id}/cancel", cookies=auth(user.id))
    client.post(f"/api/bookings/{booking_id}/cancel", cookies=auth(user.id))
    cancels = [s for s in fake.sent if "cancelled" in s["subject"].lower()]
    assert len(cancels) == 1


def test_unauthorized_cancel_sends_no_email(client, seeded, db_session, monkeypatch):
    user = _google_user(db_session)
    fake = FakeProvider()
    monkeypatch.setattr(email_service, "get_provider", lambda: fake)
    booking_id = _book(client, user.id, seeded["listing"]).json()["id"]
    before = len(fake.sent)
    # host_b is unrelated → 403, no cancellation email.
    assert client.post(f"/api/bookings/{booking_id}/cancel", cookies=auth(seeded["host_b"])).status_code == 403
    assert len(fake.sent) == before


def test_email_links_use_frontend_url(client, seeded, db_session, monkeypatch):
    user = _google_user(db_session)
    fake = FakeProvider()
    monkeypatch.setattr(email_service, "get_provider", lambda: fake)
    booking_id = _book(client, user.id, seeded["listing"]).json()["id"]
    html = fake.sent[0]["html"]
    assert f"/trips/{booking_id}" in html
