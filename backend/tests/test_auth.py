from app.services import auth_service
from tests.conftest import auth


def test_me_requires_session(client, seeded):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_current_user(client, seeded):
    res = client.get("/api/auth/me", cookies=auth(seeded["guest"]))
    assert res.status_code == 200
    assert res.json()["id"] == seeded["guest"]
    assert "email" in res.json()


def test_demo_login_sets_session(client, seeded):
    res = client.post("/api/auth/demo", json={"role": "host"})
    assert res.status_code == 200
    assert res.json()["role"] == "host"
    # The session cookie now authenticates follow-up requests on the same client.
    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["role"] == "host"


def test_logout_clears_session(client, seeded):
    client.post("/api/auth/demo", json={"role": "guest"})
    assert client.get("/api/auth/me").status_code == 200
    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code == 401


def test_google_first_login_creates_user(client, seeded, monkeypatch):
    monkeypatch.setattr(
        auth_service,
        "verify_google_credential",
        lambda credential: {"sub": "google-123", "email": "newuser@gmail.com", "name": "New User"},
    )
    res = client.post("/api/auth/google", json={"credential": "fake-token"})
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "New User"
    assert body["role"] == "guest"


def test_google_returning_login_reuses_user(client, seeded, monkeypatch):
    claims = {"sub": "google-xyz", "email": "repeat@gmail.com", "name": "Repeat User"}
    monkeypatch.setattr(auth_service, "verify_google_credential", lambda credential: claims)
    first = client.post("/api/auth/google", json={"credential": "t1"}).json()
    second = client.post("/api/auth/google", json={"credential": "t2"}).json()
    assert first["id"] == second["id"]


def test_invalid_google_token_rejected(client, seeded, monkeypatch):
    from app.errors import UnauthorizedError

    def _raise(_credential):
        raise UnauthorizedError("bad token")

    monkeypatch.setattr(auth_service, "verify_google_credential", _raise)
    assert client.post("/api/auth/google", json={"credential": "bad"}).status_code == 401


def test_become_host_promotes_guest(client, seeded):
    cookies = auth(seeded["guest"])
    assert client.get("/api/auth/me", cookies=cookies).json()["role"] == "guest"
    res = client.post("/api/auth/become-host", cookies=cookies)
    assert res.status_code == 200
    assert res.json()["role"] == "host"


def test_become_host_requires_auth(client, seeded):
    assert client.post("/api/auth/become-host").status_code == 401


def test_tampered_session_cookie_is_anonymous(client, seeded):
    res = client.get(
        "/api/auth/me",
        cookies={"sf_session": "not-a-valid-signed-token"},
    )
    assert res.status_code == 401


def test_booking_attaches_authenticated_user_not_body(client, seeded):
    # A guest books; the booking belongs to the session user regardless of any body tampering.
    from tests.conftest import iso

    res = client.post(
        "/api/bookings",
        json={"listing_id": seeded["listing"], "check_in": iso(10), "check_out": iso(12), "guests": 1},
        cookies=auth(seeded["guest"]),
    )
    assert res.status_code == 201
    assert res.json()["guest_id"] == seeded["guest"]
