from __future__ import annotations

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Amenity, Listing, ListingImage, User, UserRole


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    # Construct without the context manager so the app lifespan (which creates/seeds the
    # real database) does not run — tests use the overridden in-memory session only.
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def seeded(db_session):
    """A minimal fixed fixture: two hosts, one guest, one listing owned by host_a."""
    host_a = User(name="Host A", email="a@test.dev", role=UserRole.HOST, is_demo_switchable=True)
    host_b = User(name="Host B", email="b@test.dev", role=UserRole.HOST, is_demo_switchable=True)
    guest = User(name="Guest", email="g@test.dev", role=UserRole.GUEST, is_demo_switchable=True)
    wifi = Amenity(name="Wifi", icon="wifi", category="essentials")
    pool = Amenity(name="Pool", icon="waves", category="features")
    db_session.add_all([host_a, host_b, guest, wifi, pool])
    db_session.flush()

    listing = Listing(
        host_id=host_a.id,
        title="Test Villa by the Sea",
        description="A lovely place.",
        city="Lisbon",
        country="Portugal",
        address="12 Marina Way, Lisbon, Portugal",
        nightly_price_cents=20000,
        cleaning_fee_cents=5000,
        max_guests=4,
        bedrooms=2,
        beds=2,
        bathrooms=1.5,
        property_type="Villa",
        category="Beachfront",
    )
    listing.images.append(ListingImage(url="https://example.com/a.jpg", sort_order=0))
    listing.amenities = [wifi, pool]
    db_session.add(listing)
    db_session.commit()

    return {
        "host_a": host_a.id,
        "host_b": host_b.id,
        "guest": guest.id,
        "listing": listing.id,
        "wifi": wifi.id,
        "pool": pool.id,
    }


def auth(user_id: int) -> dict:
    """Return a session cookie for the given user, mirroring a logged-in request."""
    from app.config import get_settings
    from app.services.auth_service import create_session_token

    return {get_settings().session_cookie_name: create_session_token(user_id)}


def iso(days_from_today: int) -> str:
    return (date.today() + timedelta(days=days_from_today)).isoformat()
