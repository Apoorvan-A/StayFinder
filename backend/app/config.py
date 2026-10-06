from functools import lru_cache

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

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
