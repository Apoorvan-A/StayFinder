from fastapi import APIRouter

from app.routers import auth, bookings, favorites, health, host, listings

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(listings.router)
api_router.include_router(bookings.router)
api_router.include_router(favorites.router)
api_router.include_router(host.router)

__all__ = ["api_router"]
