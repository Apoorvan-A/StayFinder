from functools import lru_cache
from urllib.parse import urlsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, read from environment / .env."""

    database_url: str = "sqlite:///./app.db"
    cors_origins: str = "http://localhost:3000"
    seed_on_startup: bool = True

    # Auth / session
    session_secret: str = "dev-insecure-secret-change-me"
    session_cookie_name: str = "sf_session"
    session_max_age_seconds: int = 60 * 60 * 24 * 30  # 30 days
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    google_client_id: str = ""

    # Public origin used when building links in outgoing emails.
    frontend_url: str = "http://localhost:3000"

    # AI Concierge (optional). Empty api key → deterministic fallback parser is used.
    ai_provider: str = ""  # e.g. "gemini"
    ai_api_key: str = ""
    ai_model: str = ""

    # Transactional email (optional). Empty api key → delivery is skipped (logged).
    email_provider: str = ""  # e.g. "resend"
    email_api_key: str = ""
    email_from: str = "StayFinder <onboarding@resend.dev>"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def uses_cross_site_https_frontend(self) -> bool:
        """Cross-site browser cookies need Secure + SameSite=None for HTTPS frontends."""
        local_hosts = {"localhost", "127.0.0.1", "::1"}
        return any(
            parsed.scheme == "https"
            and parsed.hostname is not None
            and parsed.hostname.lower() not in local_hosts
            for parsed in (urlsplit(origin) for origin in self.cors_origin_list)
        )

    @property
    def session_cookie_secure(self) -> bool:
        # Keep local HTTP development unchanged; external HTTPS CORS origins require Secure.
        return self.cookie_secure or self.uses_cross_site_https_frontend

    @property
    def session_cookie_samesite(self) -> str:
        # SameSite=Lax cookies are omitted on cross-site fetches from Vercel to Railway.
        return "none" if self.uses_cross_site_https_frontend else self.cookie_samesite


@lru_cache
def get_settings() -> Settings:
    return Settings()
