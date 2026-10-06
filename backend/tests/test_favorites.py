from tests.conftest import auth


def test_add_and_list_favorite(client, seeded):
    lid = seeded["listing"]
    assert client.post(f"/api/favorites/{lid}", headers=auth(seeded["guest"])).status_code == 201
    favs = client.get("/api/favorites", headers=auth(seeded["guest"])).json()
    assert len(favs) == 1
    assert favs[0]["id"] == lid
    assert favs[0]["is_favorited"] is True


def test_remove_favorite(client, seeded):
    lid = seeded["listing"]
    client.post(f"/api/favorites/{lid}", headers=auth(seeded["guest"]))
    client.delete(f"/api/favorites/{lid}", headers=auth(seeded["guest"]))
    assert client.get("/api/favorites", headers=auth(seeded["guest"])).json() == []


def test_duplicate_favorite_rejected(client, seeded):
    lid = seeded["listing"]
    client.post(f"/api/favorites/{lid}", headers=auth(seeded["guest"]))
    res = client.post(f"/api/favorites/{lid}", headers=auth(seeded["guest"]))
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "DUPLICATE_FAVORITE"


def test_favorite_nonexistent_listing_404(client, seeded):
    assert client.post("/api/favorites/999999", headers=auth(seeded["guest"])).status_code == 404
