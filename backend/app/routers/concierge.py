from fastapi import APIRouter

from app.deps import DbSession
from app.schemas.concierge import ConciergeRequest, ConciergeResponse
from app.services.concierge import service

router = APIRouter(tags=["concierge"])


@router.post("/concierge", response_model=ConciergeResponse)
def concierge(payload: ConciergeRequest, db: DbSession) -> ConciergeResponse:
    """Natural-language stay discovery over real StayFinder inventory. Public (browsing is public)."""
    return service.run(db, payload.message)
