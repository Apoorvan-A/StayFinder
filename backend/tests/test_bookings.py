from tests.conftest import auth, iso


def _book(client, seeded, user_id, ci, co, guests=2):
    return client.post(
        "/api/bookings",
        json={"listing_id": seeded["listing"], "check_in": iso(ci), "check_out": iso(co), "guests": guests},
        headers=auth(user_id),
    )


def test_valid_booking_succeeds_and_persists(client, seeded):
    res = _book(client, seeded, seeded["guest"], 10, 13)
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "confirmed"
    assert body["night_count"] == 3
    assert len(body["confirmation_code"]) == 8

    trips = client.get("/api/trips", headers=auth(seeded["guest"])).json()
    assert len(trips) == 1
    assert trips[0]["confirmation_code"] == body["confirmation_code"]


def test_pricing_computed_server_side(client, seeded):
    # nightly 20000c * 3 = 60000; cleaning 5000; service 14% of 60000 = 8400;
    # taxes 8% of (60000+5000) = 5200; total = 78600
    body = _book(client, seeded, seeded["guest"], 10, 13).json()
    assert body["nightly_rate_snapshot_cents"] == 20000
    assert body["cleaning_fee_cents"] == 5000
    assert body["service_fee_cents"] == 8400
    assert body["taxes_cents"] == 5200
    assert body["total_cents"] == 78600


def test_confirmed_booking_blocks_dates(client, seeded):
    _book(client, seeded, seeded["guest"], 10, 13)
    res = client.get(
        "/api/listings",
        params={"check_in": iso(11), "check_out": iso(12)},
    )
    assert res.json()["total"] == 0


def test_overlapping_booking_rejected(client, seeded):
    _book(client, seeded, seeded["guest"], 10, 13)
    res = _book(client, seeded, seeded["host_b"], 11, 14)
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "BOOKING_CONFLICT"


def test_adjacent_booking_allowed(client, seeded):
    assert _book(client, seeded, seeded["guest"], 10, 12).status_code == 201
    # Check-in on the previous booking's checkout day is allowed.
    assert _book(client, seeded, seeded["guest"], 12, 14).status_code == 201


def test_booking_surrounding_existing_rejected(client, seeded):
    _book(client, seeded, seeded["guest"], 11, 13)
    assert _book(client, seeded, seeded["guest"], 10, 14).status_code == 409


def test_booking_inside_existing_rejected(client, seeded):
    _book(client, seeded, seeded["guest"], 10, 15)
    assert _book(client, seeded, seeded["guest"], 11, 13).status_code == 409


def test_reverse_date_range_rejected(client, seeded):
    assert _book(client, seeded, seeded["guest"], 13, 10).status_code == 422


def test_zero_night_rejected(client, seeded):
    assert _book(client, seeded, seeded["guest"], 10, 10).status_code == 422


def test_past_dates_rejected(client, seeded):
    assert _book(client, seeded, seeded["guest"], -5, -2).status_code == 422


def test_capacity_overflow_rejected(client, seeded):
    assert _book(client, seeded, seeded["guest"], 10, 12, guests=5).status_code == 422


def test_zero_guests_rejected(client, seeded):
    assert _book(client, seeded, seeded["guest"], 10, 12, guests=0).status_code == 422


def test_nonexistent_listing_rejected(client, seeded):
    res = client.post(
        "/api/bookings",
        json={"listing_id": 999999, "check_in": iso(10), "check_out": iso(12), "guests": 1},
        headers=auth(seeded["guest"]),
    )
    assert res.status_code == 404


def test_booking_requires_auth(client, seeded):
    res = _book_no_auth = client.post(
        "/api/bookings",
        json={"listing_id": seeded["listing"], "check_in": iso(10), "check_out": iso(12), "guests": 1},
    )
    assert res.status_code == 401


def test_cancelled_booking_frees_availability(client, seeded):
    created = _book(client, seeded, seeded["guest"], 10, 13).json()
    # Blocked while confirmed.
    assert _book(client, seeded, seeded["guest"], 10, 13).status_code == 409
    client.post(f"/api/bookings/{created['id']}/cancel", headers=auth(seeded["guest"]))
    # Freed after cancellation.
    assert _book(client, seeded, seeded["guest"], 10, 13).status_code == 201


def test_cannot_cancel_another_users_booking(client, seeded):
    created = _book(client, seeded, seeded["guest"], 10, 13).json()
    res = client.post(f"/api/bookings/{created['id']}/cancel", headers=auth(seeded["host_b"]))
    assert res.status_code == 403


def test_quote_matches_booking_total(client, seeded):
    quote = client.post(
        "/api/bookings/quote",
        json={"listing_id": seeded["listing"], "check_in": iso(10), "check_out": iso(13), "guests": 2},
    ).json()
    assert quote["available"] is True
    booking = _book(client, seeded, seeded["guest"], 10, 13).json()
    assert quote["total_cents"] == booking["total_cents"]
