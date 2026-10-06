from tests.conftest import auth


def test_host_can_edit_own_listing(client, seeded):
    res = client.patch(
        f"/api/host/listings/{seeded['listing']}",
        json={"title": "Renamed Villa by the Sea"},
        cookies=auth(seeded["host_a"]),
    )
    assert res.status_code == 200
    assert res.json()["title"] == "Renamed Villa by the Sea"


def test_host_cannot_edit_another_hosts_listing(client, seeded):
    res = client.patch(
        f"/api/host/listings/{seeded['listing']}",
        json={"title": "Hijacked"},
        cookies=auth(seeded["host_b"]),
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"


def test_host_cannot_delete_another_hosts_listing(client, seeded):
    res = client.delete(
        f"/api/host/listings/{seeded['listing']}", cookies=auth(seeded["host_b"])
    )
    assert res.status_code == 403


def test_host_mutation_requires_auth(client, seeded):
    assert client.get("/api/host/metrics").status_code == 401
    assert (
        client.patch(f"/api/host/listings/{seeded['listing']}", json={"title": "x"}).status_code
        == 401
    )
