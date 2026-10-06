from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.errors import register_exception_handlers
from app.routers import api_router

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    if settings.seed_on_startup:
        from app.seed import seed_if_empty

        with SessionLocal() as db:
            seed_if_empty(db)
    yield


app = FastAPI(
    title="StayFinder API",
    description="Backend for an Airbnb-style property marketplace.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(api_router)


@app.get("/")
def root() -> dict:
    return {"name": "StayFinder API", "docs": "/docs", "health": "/api/health"}
