from tests.conftest import auth


def _start(client, seeded, user_id, body="Hi, is this available next month?"):
    return client.post(
        "/api/conversations",
        json={"listing_id": seeded["listing"], "body": body},
        cookies=auth(user_id),
    )


def test_guest_starts_conversation_persists(client, seeded):
    res = _start(client, seeded, seeded["guest"])
    assert res.status_code == 201
    body = res.json()
    assert body["viewer_role"] == "guest"
    assert len(body["messages"]) == 1
    assert body["messages"][0]["sender_id"] == seeded["guest"]
    assert body["counterparty"]["id"] == seeded["host_a"]


def test_host_sees_conversation_and_replies(client, seeded):
    conv = _start(client, seeded, seeded["guest"]).json()
    # Host sees it in their list.
    host_list = client.get("/api/conversations", cookies=auth(seeded["host_a"])).json()
    assert any(c["id"] == conv["id"] for c in host_list)
    # Host replies.
    reply = client.post(
        f"/api/conversations/{conv['id']}/messages",
        json={"body": "Yes, those dates are open!"},
        cookies=auth(seeded["host_a"]),
    )
    assert reply.status_code == 200
    assert reply.json()["viewer_role"] == "host"
    # Guest sees the reply.
    guest_view = client.get(f"/api/conversations/{conv['id']}", cookies=auth(seeded["guest"])).json()
    bodies = [m["body"] for m in guest_view["messages"]]
    assert "Yes, those dates are open!" in bodies


def test_unrelated_user_denied(client, seeded):
    conv = _start(client, seeded, seeded["guest"]).json()
    # host_b is neither the guest nor the listing's host.
    assert client.get(f"/api/conversations/{conv['id']}", cookies=auth(seeded["host_b"])).status_code == 403
    assert (
        client.post(
            f"/api/conversations/{conv['id']}/messages",
            json={"body": "sneaky"},
            cookies=auth(seeded["host_b"]),
        ).status_code
        == 403
    )


def test_anonymous_rejected(client, seeded):
    assert client.post(
        "/api/conversations", json={"listing_id": seeded["listing"], "body": "hi"}
    ).status_code == 401
    assert client.get("/api/conversations").status_code == 401


def test_host_cannot_message_own_listing(client, seeded):
    res = _start(client, seeded, seeded["host_a"])
    assert res.status_code == 422


def test_conversation_invalid_listing(client, seeded):
    res = client.post(
        "/api/conversations", json={"listing_id": 999999, "body": "hi"}, cookies=auth(seeded["guest"])
    )
    assert res.status_code == 404


def test_reopening_same_listing_reuses_conversation(client, seeded):
    first = _start(client, seeded, seeded["guest"]).json()
    second = _start(client, seeded, seeded["guest"], body="One more question!").json()
    assert first["id"] == second["id"]
    assert len(second["messages"]) == 2
