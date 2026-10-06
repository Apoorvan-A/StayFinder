from tests.conftest import auth


def test_list_listings_pagination_shape(client, seeded):
    res = client.get("/api/listings")
    assert res.status_code == 200
    body = res.json()
    assert set(body) == {"items", "page", "page_size", "total", "total_pages"}
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Test Villa by the Sea"


def test_location_search_matches_city(client, seeded):
    assert client.get("/api/listings", params={"location": "Lisbon"}).json()["total"] == 1
    assert client.get("/api/listings", params={"location": "Tokyo"}).json()["total"] == 0


def test_price_filter(client, seeded):
    assert client.get("/api/listings", params={"min_price": 30000}).json()["total"] == 0
    assert client.get("/api/listings", params={"max_price": 30000}).json()["total"] == 1


def test_property_type_filter(client, seeded):
    assert client.get("/api/listings", params={"property_type": "Villa"}).json()["total"] == 1
    assert client.get("/api/listings", params={"property_type": "Cabin"}).json()["total"] == 0


def test_amenity_filter(client, seeded):
    assert client.get("/api/listings", params={"amenities": seeded["wifi"]}).json()["total"] == 1
    # An amenity the listing lacks yields no results.
    assert client.get("/api/listings", params={"amenities": 9999}).json()["total"] == 0


def test_guest_capacity_filter(client, seeded):
    assert client.get("/api/listings", params={"guests": 4}).json()["total"] == 1
    assert client.get("/api/listings", params={"guests": 5}).json()["total"] == 0


def test_detail_includes_host_and_amenities(client, seeded):
    res = client.get(f"/api/listings/{seeded['listing']}")
    assert res.status_code == 200
    body = res.json()
    assert body["host"]["name"] == "Host A"
    assert {a["name"] for a in body["amenities"]} == {"Wifi", "Pool"}


def test_detail_404(client, seeded):
    res = client.get("/api/listings/999999")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "LISTING_NOT_FOUND"


def test_favorited_flag_reflects_user(client, seeded):
    lid = seeded["listing"]
    client.post(f"/api/favorites/{lid}", headers=auth(seeded["guest"]))
    res = client.get("/api/listings", headers=auth(seeded["guest"]))
    assert res.json()["items"][0]["is_favorited"] is True
    # Anonymous request never reports favorited.
    assert client.get("/api/listings").json()["items"][0]["is_favorited"] is False
