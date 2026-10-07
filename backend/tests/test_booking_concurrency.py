"""Real SQLite connections and independent authenticated clients racing for dates."""

from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from threading import Barrier
from time import sleep

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import Booking, BookingStatus, Listing, User, UserRole
from app.services import availability
from tests.conftest import auth


@pytest.fixture
def race_database(tmp_path, monkeypatch):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'race.db'}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine, autoflush=False)
    with sessions() as db:
        users = [User(name=f"Guest {i}", email=f"race{i}@test.dev", role=UserRole.GUEST)
                 for i in range(3)]
        db.add_all(users)
        db.flush()
        ids = [user.id for user in users]
        listing = Listing(host_id=ids[2], title="Concurrency fixture", description="QA",
                          city="Lisbon", country="Portugal", nightly_price_cents=20000,
                          cleaning_fee_cents=5000, max_guests=4, bedrooms=2, beds=2,
                          bathrooms=1, property_type="Villa", category="Beachfront")
        db.add(listing)
        db.commit()
        listing_id = listing.id

    def independent_session():
        with sessions() as db:
            yield db

    # Widen the read/write gap: without a database lock both requests observe no conflict.
    original = availability.find_conflicts

    def delayed_conflicts(*args, **kwargs):
        result = original(*args, **kwargs)
        sleep(0.05)
        return result

    monkeypatch.setattr(availability, "find_conflicts", delayed_conflicts)
    app.dependency_overrides[get_db] = independent_session
    try:
        yield sessions, ids, listing_id
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def race(race_database, intervals, user_indices=None):
    sessions, users, listing_id = race_database
    start = date.today() + timedelta(days=180)
    barrier = Barrier(len(intervals))

    # Do not enter TestClient's context: production lifespan must not seed a test database.
    def submit(index):
        ci, co = intervals[index]
        user = users[user_indices[index] if user_indices else index]
        client = TestClient(app)
        client.cookies.update(auth(user))
        barrier.wait(timeout=5)
        try:
            return client.post("/api/bookings", json={
                "listing_id": listing_id, "check_in": str(start + timedelta(days=ci)),
                "check_out": str(start + timedelta(days=co)), "guests": 2,
            })
        finally:
            client.close()

    with ThreadPoolExecutor(max_workers=len(intervals)) as pool:
        responses = list(pool.map(submit, range(len(intervals))))
    with sessions() as db:
        bookings = list(db.scalars(select(Booking).where(Booking.status.in_(BookingStatus.BLOCKING))))
        for booking in bookings:
            subtotal = booking.nightly_rate_snapshot_cents * booking.night_count
            assert booking.total_cents == (subtotal + booking.cleaning_fee_cents
                                           + booking.service_fee_cents + booking.taxes_cents)
        for i, booking in enumerate(bookings):
            for other in bookings[i + 1:]:
                assert not (booking.check_in < other.check_out and booking.check_out > other.check_in)
    return responses, bookings


@pytest.mark.parametrize("attempt", range(5))
def test_same_dates_race(race_database, attempt):
    responses, bookings = race(race_database, [(attempt * 10, attempt * 10 + 3)] * 2)
    assert sorted(r.status_code for r in responses) == [201, 409]
    assert len(bookings) == 1


@pytest.mark.parametrize("competitor", [(2, 4), (-2, 2), (4, 8), (-2, 8)])
def test_overlap_shapes_race(race_database, competitor):
    responses, bookings = race(race_database, [(0, 5), competitor])
    assert sorted(r.status_code for r in responses) == [201, 409]
    assert len(bookings) == 1


@pytest.mark.parametrize("intervals", [[(0, 3), (3, 6)], [(3, 6), (0, 3)]])
def test_adjacent_race(race_database, intervals):
    responses, bookings = race(race_database, intervals)
    assert [r.status_code for r in responses] == [201, 201]
    assert len(bookings) == 2


def test_three_contenders(race_database):
    responses, bookings = race(race_database, [(0, 3)] * 3)
    assert sorted(r.status_code for r in responses) == [201, 409, 409]
    assert len(bookings) == 1


def test_same_user_double_submit(race_database):
    responses, bookings = race(race_database, [(0, 3)] * 2, [0, 0])
    assert sorted(r.status_code for r in responses) == [201, 409]
    assert len(bookings) == 1


def test_winner_isolation_and_cancel_rebook(race_database):
    sessions, users, _ = race_database
    responses, bookings = race(race_database, [(0, 3)] * 2)
    winner = next(i for i, response in enumerate(responses) if response.status_code == 201)
    loser = 1 - winner
    booking_id = bookings[0].id
    client = TestClient(app)
    client.cookies.update(auth(users[loser]))
    assert client.get(f"/api/bookings/{booking_id}").status_code == 403
    assert client.post(f"/api/bookings/{booking_id}/cancel").status_code == 403
    assert client.get("/api/trips").json() == []
    client.cookies.update(auth(users[winner]))
    assert client.get(f"/api/bookings/{booking_id}").status_code == 200
    assert client.post(f"/api/bookings/{booking_id}/cancel").status_code == 200
    client.close()
    responses, bookings = race(race_database, [(0, 3)] * 2)
    assert sorted(r.status_code for r in responses) == [201, 409]
    assert len(bookings) == 1
    with sessions() as db:
        assert db.get(Booking, booking_id).status == BookingStatus.CANCELLED


def test_only_race_winner_sends_email(race_database, monkeypatch):
    sessions, users, _ = race_database
    with sessions() as db:
        for user_id in users[:2]:
            db.get(User, user_id).provider = "google"
        db.commit()
    deliveries = []

    class RecordingProvider:
        def send(self, **kwargs):
            deliveries.append(kwargs)
            return "test-email-id"

    monkeypatch.setattr("app.services.email.service.get_provider", lambda: RecordingProvider())
    responses, bookings = race(race_database, [(0, 3)] * 2)
    assert sorted(r.status_code for r in responses) == [201, 409]
    assert len(deliveries) == 1
    with sessions() as db:
        assert len(list(db.scalars(select(Booking)))) == 1
        assert db.get(Booking, bookings[0].id).confirmation_email_sent_at is not None
