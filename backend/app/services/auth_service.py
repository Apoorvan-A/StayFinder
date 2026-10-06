"""Authentication: signed session tokens, Google verification, user provisioning."""

from __future__ import annotations

from functools import lru_cache

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.errors import UnauthorizedError, ValidationError
from app.models import User, UserRole

_SESSION_SALT = "stayfinder-session"

# Stable identities for the built-in demo slots, independent of mutable role.
DEMO_GUEST_EMAIL = "alex@stayfinder.demo"
DEMO_HOST_EMAIL = "sofia@stayfinder.demo"


@lru_cache
def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(get_settings().session_secret, salt=_SESSION_SALT)


def create_session_token(user_id: int) -> str:
    return _serializer().dumps({"uid": user_id})


def read_session_token(token: str) -> int | None:
    try:
        data = _serializer().loads(token, max_age=get_settings().session_max_age_seconds)
    except (BadSignature, SignatureExpired):
        return None
    uid = data.get("uid") if isinstance(data, dict) else None
    return int(uid) if uid is not None else None


def verify_google_credential(credential: str) -> dict:
    """Verify a Google ID token and return its claims. Isolated so tests can monkeypatch it.

    Raises UnauthorizedError if the token is invalid or the audience does not match.
    """
    settings = get_settings()
    if not settings.google_client_id:
        raise ValidationError("Google sign-in is not configured on this server.")

    # Imported lazily so the dependency isn't required unless Google login is used.
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    try:
        claims = id_token.verify_oauth2_token(
            credential, google_requests.Request(), settings.google_client_id
        )
    except ValueError as exc:
        raise UnauthorizedError("Google sign-in failed. Please try again.") from exc

    if not claims.get("sub"):
        raise UnauthorizedError("Google sign-in returned an invalid token.")
    return claims


def upsert_google_user(db: Session, claims: dict) -> User:
    """Find or create a user from verified Google claims, keyed by provider subject id."""
    subject = str(claims["sub"])
    user = db.scalar(
        select(User).where(User.provider == "google", User.provider_subject_id == subject)
    )
    email = claims.get("email")
    name = claims.get("name") or (email.split("@")[0] if email else "Guest")
    picture = claims.get("picture")

    if user is None:
        # A pre-existing demo/placeholder account with the same email should not be hijacked;
        # Google identity is keyed on the immutable subject id, not email.
        user = User(
            name=name,
            email=email or f"{subject}@users.stayfinder",
            avatar_url=picture,
            role=UserRole.GUEST,
            provider="google",
            provider_subject_id=subject,
        )
        db.add(user)
    else:
        # Keep profile fields fresh on each login.
        user.name = name
        if picture:
            user.avatar_url = picture
    db.commit()
    db.refresh(user)
    return user


def get_demo_user(db: Session, role: str) -> User:
    """Resolve a built-in demo identity for instant, friction-free evaluation.

    Demo slots are keyed on a stable email (not the mutable role), and the slot's role is
    reset on each login so demo sessions are always deterministic — e.g. "demo guest" is
    always a guest even if a previous session promoted that shared account to host.
    """
    wanted = UserRole.HOST if role == UserRole.HOST else UserRole.GUEST
    email = DEMO_HOST_EMAIL if wanted == UserRole.HOST else DEMO_GUEST_EMAIL

    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        # Fallback: any switchable demo user currently holding the wanted role.
        user = db.scalar(
            select(User)
            .where(User.is_demo_switchable.is_(True), User.role == wanted)
            .order_by(User.id)
        )
    if user is None:
        raise UnauthorizedError("No demo user is available. Reseed the database.")

    if user.role != wanted:
        user.role = wanted
        db.commit()
        db.refresh(user)
    return user
