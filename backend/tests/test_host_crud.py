from tests.conftest import auth, iso


def _new_listing_payload(**overrides):
    payload = {
        "title": "Brand New Loft",
        "description": "Fresh and bright.",
        "city": "Porto",
        "country": "Portugal",
        "nightly_price_cents": 15000,
        "cleaning_fee_cents": 3000,
        "max_guests": 3,
        "bedrooms": 1,
        "beds": 2,
        "bathrooms": 1.0,
        "property_type": "Loft",
        "category": "City",
        "image_urls": ["https://example.com/1.jpg", "https://example.com/2.jpg"],
        "amenity_ids": [],
    }
    payload.update(overrides)
    return payload


def test_create_listing(client, seeded):
    res = client.post(
        "/api/host/listings",
        json=_new_listing_payload(amenity_ids=[seeded["wifi"]]),
        cookies=auth(seeded["host_b"]),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["title"] == "Brand New Loft"
    assert len(body["images"]) == 2
    assert {a["id"] for a in body["amenities"]} == {seeded["wifi"]}

    owned = client.get("/api/host/listings", cookies=auth(seeded["host_b"])).json()
    assert any(listing["title"] == "Brand New Loft" for listing in owned)


def test_update_listing_changes_persist(client, seeded):
    client.patch(
        f"/api/host/listings/{seeded['listing']}",
        json={"nightly_price_cents": 25000, "image_urls": ["https://example.com/x.jpg"]},
        cookies=auth(seeded["host_a"]),
    )
    detail = client.get(f"/api/listings/{seeded['listing']}").json()
    assert detail["nightly_price_cents"] == 25000
    assert len(detail["images"]) == 1


def test_delete_listing_removes_it(client, seeded):
    res = client.delete(f"/api/host/listings/{seeded['listing']}", cookies=auth(seeded["host_a"]))
    assert res.status_code == 200
    assert client.get(f"/api/listings/{seeded['listing']}").status_code == 404


def test_delete_listing_with_bookings_leaves_no_orphans(client, seeded):
    # Create a booking, then delete the listing; the booking must be gone (cascade), not orphaned.
    booking = client.post(
        "/api/bookings",
        json={"listing_id": seeded["listing"], "check_in": iso(10), "check_out": iso(12), "guests": 1},
        cookies=auth(seeded["guest"]),
    ).json()
    client.delete(f"/api/host/listings/{seeded['listing']}", cookies=auth(seeded["host_a"]))
    trips = client.get("/api/trips", cookies=auth(seeded["guest"])).json()
    assert all(t["id"] != booking["id"] for t in trips)


def test_host_metrics_from_real_data(client, seeded):
    client.post(
        "/api/bookings",
        json={"listing_id": seeded["listing"], "check_in": iso(20), "check_out": iso(23), "guests": 2},
        cookies=auth(seeded["guest"]),
    )
    metrics = client.get("/api/host/metrics", cookies=auth(seeded["host_a"])).json()
    assert metrics["active_listings"] == 1
    assert metrics["total_reservations"] == 1
    assert metrics["upcoming_reservations"] == 1
    assert metrics["revenue_cents"] > 0
