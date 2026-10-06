from fastapi import APIRouter

from app.deps import CurrentUser, DbSession
from app.models import Conversation, UserRole
from app.schemas.message import (
    ConversationDetail,
    ConversationSummary,
    MessageCreate,
    MessageOut,
    StartConversation,
)
from app.serializers import to_card
from app.services import messaging_service

router = APIRouter(tags=["messages"])


def _viewer_role(conv: Conversation, user_id: int) -> str:
    return UserRole.GUEST if conv.guest_id == user_id else UserRole.HOST


def _to_detail(conv: Conversation, user_id: int) -> ConversationDetail:
    return ConversationDetail(
        id=conv.id,
        listing=to_card(conv.listing, set()),
        counterparty=messaging_service.counterparty_of(conv, user_id),
        viewer_role=_viewer_role(conv, user_id),
        messages=[MessageOut.model_validate(m) for m in conv.messages],
    )


@router.post("/conversations", response_model=ConversationDetail, status_code=201)
def start_conversation(
    payload: StartConversation, db: DbSession, user: CurrentUser
) -> ConversationDetail:
    conv = messaging_service.start_conversation(
        db, user=user, listing_id=payload.listing_id, body=payload.body
    )
    return _to_detail(conv, user.id)


@router.get("/conversations", response_model=list[ConversationSummary])
def list_conversations(db: DbSession, user: CurrentUser) -> list[ConversationSummary]:
    conversations = messaging_service.list_conversations(db, user=user)
    result: list[ConversationSummary] = []
    for conv in conversations:
        last = conv.messages[-1] if conv.messages else None
        result.append(
            ConversationSummary(
                id=conv.id,
                listing=to_card(conv.listing, set()),
                counterparty=messaging_service.counterparty_of(conv, user.id),
                last_message=last.body if last else None,
                last_message_at=last.created_at if last else conv.updated_at,
                unread_count=messaging_service.unread_count_for(conv, user.id),
            )
        )
    return result


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: int, db: DbSession, user: CurrentUser
) -> ConversationDetail:
    conv = messaging_service.get_conversation(db, user=user, conversation_id=conversation_id)
    return _to_detail(conv, user.id)


@router.post("/conversations/{conversation_id}/messages", response_model=ConversationDetail)
def send_message(
    conversation_id: int, payload: MessageCreate, db: DbSession, user: CurrentUser
) -> ConversationDetail:
    conv = messaging_service.send_message(
        db, user=user, conversation_id=conversation_id, body=payload.body
    )
    return _to_detail(conv, user.id)
