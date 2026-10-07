"""Transactional email provider abstraction.

StayFinder sends mail FROM its own provider (Resend) TO the authenticated user's verified
email. It never sends through the user's Gmail account and never uses Gmail send scopes.
Isolated behind `get_provider()` so booking code has no provider-specific logic and tests can
mock it. Returns None when unconfigured (local dev / demo), so delivery is simply skipped.
"""

from __future__ import annotations

from typing import Protocol

import httpx

from app.config import get_settings


class EmailProvider(Protocol):
    def send(self, *, to: str, subject: str, html: str, text: str) -> bool: ...


class ResendProvider:
    def __init__(self, api_key: str, sender: str):
        self._api_key = api_key
        self._sender = sender

    def send(self, *, to: str, subject: str, html: str, text: str) -> bool:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"},
            json={"from": self._sender, "to": [to], "subject": subject, "html": html, "text": text},
            timeout=15,
        )
        resp.raise_for_status()
        return True


def get_provider() -> EmailProvider | None:
    settings = get_settings()
    if settings.email_provider == "resend" and settings.email_api_key:
        return ResendProvider(settings.email_api_key, settings.email_from)
    return None
