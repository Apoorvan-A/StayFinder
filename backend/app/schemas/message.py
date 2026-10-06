from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.listing import ListingCard
from app.schemas.user import UserPublic


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_id: int
    body: str
    is_read: bool
    created_at: datetime


class StartConversation(BaseModel):
    listing_id: int
    body: str = Field(min_length=1, max_length=2000)


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class ConversationSummary(BaseModel):
    """One row in the conversations list."""

    id: int
    listing: ListingCard
    counterparty: UserPublic
    last_message: str | None
    last_message_at: datetime
    unread_count: int


class ConversationDetail(BaseModel):
    id: int
    listing: ListingCard
    counterparty: UserPublic
    viewer_role: str  # "guest" or "host" — who the current user is in this thread
    messages: list[MessageOut]
