from datetime import date, timedelta

from app.services.concierge import service as concierge_service


def _ask(client, message, cookies=None):
    return client.post("/api/concierge", json={"message": message}, cookies=cookies or {})


def test_concierge_is_public(client, seeded):
    # Browsing is public, so the concierge needs no auth.
    assert _ask(client, "beachfront villa in Lisbon").status_code == 200


def test_concierge_parses_and_returns_real_listing(client, seeded):
    res = _ask(client, "beachfront villa in Lisbon for 4 under $300 with a pool")
    assert res.status_code == 200
    body = res.json()
    assert body["intent"]["location"] == "Lisbon"
    assert body["intent"]["property_type"] == "Villa"
    assert body["intent"]["category"] == "Beachfront"
    assert body["intent"]["guests"] == 4
    assert body["intent"]["max_price_cents"] == 30000
    assert "Pool" in body["intent"]["amenities"]
    assert body["total"] == 1
    assert body["listings"][0]["id"] == seeded["listing"]
    assert "query_string" in body and "location=Lisbon" in body["query_string"]


def test_concierge_only_returns_real_listings(client, seeded):
    body = _ask(client, "somewhere nice for a getaway").json()
    valid_ids = {seeded["listing"]}
    assert all(listing["id"] in valid_ids for listing in body["listings"])


def test_concierge_no_results(client, seeded):
    body = _ask(client, "a cabin in Tokyo for 20 guests under $20").json()
    assert body["total"] == 0
    assert "No stays matched" in body["interpretation"]


def test_concierge_ambiguous_asks_to_clarify(client, seeded):
    body = _ask(client, "hello there").json()
    assert body["clarify"] is not None
    # Still returns some real inventory to get started.
    assert body["total"] >= 1


def test_concierge_price_sort(client, seeded):
    body = _ask(client, "cheapest places in Lisbon").json()
    assert body["intent"]["sort"] == "price_asc"
    assert body["intent"]["location"] == "Lisbon"


def test_concierge_unknown_explicit_location_returns_no_results(client, seeded, monkeypatch):
    monkeypatch.setattr(concierge_service, "get_provider", lambda: None)

    body = _ask(client, "do you have any properties in India").json()

    assert body["intent"]["location"] == "India"
    assert body["total"] == 0
    assert body["listings"] == []
    assert "No stays matched" in body["interpretation"]


def test_concierge_greece_prompt_parses_filters_without_inventing_inventory(client, seeded, monkeypatch):
    monkeypatch.setattr(concierge_service, "get_provider", lambda: None)

    body = _ask(client, "beachfront villa in Greece for 4 with a pool").json()

    assert body["intent"]["location"] == "Greece"
    assert body["intent"]["property_type"] == "Villa"
    assert body["intent"]["category"] == "Beachfront"
    assert body["intent"]["guests"] == 4
    assert "Pool" in body["intent"]["amenities"]
    assert body["total"] == 0
    assert body["listings"] == []


def test_concierge_uses_llm_provider_and_respects_availability(client, seeded, monkeypatch):
    # Simulate a configured LLM returning structured intent with dates.
    def iso(n):
        return (date.today() + timedelta(days=n)).isoformat()

    class FakeProvider:
        def extract_intent(self, message):
            return {"location": "Lisbon", "check_in": iso(10), "check_out": iso(13), "guests": 2}

    monkeypatch.setattr(concierge_service, "get_provider", lambda: FakeProvider())

    # Available first.
    assert _ask(client, "lisbon trip").json()["total"] == 1

    # Book those exact dates, then the concierge must not return the now-unavailable listing.
    from tests.conftest import auth

    client.post(
        "/api/bookings",
        json={"listing_id": seeded["listing"], "check_in": iso(10), "check_out": iso(13), "guests": 2},
        cookies=auth(seeded["guest"]),
    )
    assert _ask(client, "lisbon trip").json()["total"] == 0


def test_concierge_falls_back_when_provider_errors(client, seeded, monkeypatch):
    class BrokenProvider:
        def extract_intent(self, message):
            raise RuntimeError("provider down")

    monkeypatch.setattr(concierge_service, "get_provider", lambda: BrokenProvider())
    # Falls back to the deterministic parser — still a valid 200 response.
    body = _ask(client, "villa in Lisbon").json()
    assert body["intent"]["location"] == "Lisbon"
    assert body["total"] == 1


def test_gemini_provider_uses_supported_generate_content_request(monkeypatch, caplog):
    import logging

    from app.services.concierge.provider import GeminiProvider, INTENT_SCHEMA, _SYSTEM

    captured = {}

    class Response:
        status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            return {"candidates": [{"content": {"parts": [{"text": '{"location":"India"}'}]}}]}

    def fake_post(url, **kwargs):
        captured["url"] = url
        captured.update(kwargs)
        return Response()

    monkeypatch.setattr("httpx.post", fake_post)
    provider = GeminiProvider("test-key", "gemini-3.8-flash")
    caplog.set_level(logging.INFO)

    assert provider.extract_intent("do you have any properties in india") == {"location": "India"}
    assert captured["url"].endswith("/v1beta/models/gemini-3.8-flash:generateContent")
    assert captured["headers"]["x-goog-api-key"] == "test-key"
    assert "key" not in captured
    assert captured["json"]["systemInstruction"]["parts"][0]["text"] == _SYSTEM
    assert captured["json"]["contents"][0]["parts"][0]["text"] == "do you have any properties in india"
    config = captured["json"]["generationConfig"]
    assert config["responseMimeType"] == "application/json"
    assert config["responseSchema"] == INTENT_SCHEMA
    assert "temperature" not in config
    assert "event=http_response status=200" in caplog.text
    assert "test-key" not in caplog.text
