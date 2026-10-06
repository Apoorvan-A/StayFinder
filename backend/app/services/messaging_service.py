from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.errors import ForbiddenError, ListingNotFoundError, NotFoundError, ValidationError
from app.models import Conversation, Listing, Message, User


def _get_conversation_for_user(db: Session, conversation_id: int, user_id: int) -> Conversation:
    conv = db.scalar(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(
            selectinload(Conversation.messages),
            selectinload(Conversation.listing).selectinload(Listing.images),
            selectinload(Conversation.guest),
            selectinload(Conversation.host),
        )
    )
    if conv is None:
        raise NotFoundError("Conversation not found.")
    if not conv.involves(user_id):
        raise ForbiddenError("You don't have access to this conversation.")
    return conv


def start_conversation(db: Session, *, user: User, listing_id: int, body: str) -> Conversation:
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise ListingNotFoundError("That listing could not be found.")
    if listing.host_id == user.id:
        raise ValidationError("You can't message yourself about your own listing.")

    conv = db.scalar(
        select(Conversation).where(
            Conversation.listing_id == listing_id, Conversation.guest_id == user.id
        )
    )
    if conv is None:
        conv = Conversation(listing_id=listing_id, guest_id=user.id, host_id=listing.host_id)
        db.add(conv)
        db.flush()

    conv.messages.append(Message(sender_id=user.id, body=body.strip()))
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    return _get_conversation_for_user(db, conv.id, user.id)


def start_from_booking(db: Session, *, user: User, booking_id: int, body: str) -> Conversation:
    """Get-or-create the conversation tied to a booking; either participant may use it."""
    from app.models import Booking

    booking = db.get(Booking, booking_id)
    if booking is None:
        raise NotFoundError("Reservation not found.")
    listing = db.get(Listing, booking.listing_id)
    if listing is None or (user.id not in (booking.guest_id, listing.host_id)):
        raise ForbiddenError("You don't have access to this reservation.")

    conv = db.scalar(
        select(Conversation).where(
            Conversation.listing_id == listing.id, Conversation.guest_id == booking.guest_id
        )
    )
    if conv is None:
        conv = Conversation(
            listing_id=listing.id, guest_id=booking.guest_id, host_id=listing.host_id
        )
        db.add(conv)
        db.flush()

    conv.messages.append(Message(sender_id=user.id, body=body.strip()))
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    return _get_conversation_for_user(db, conv.id, user.id)


def send_message(db: Session, *, user: User, conversation_id: int, body: str) -> Conversation:
    conv = _get_conversation_for_user(db, conversation_id, user.id)
    conv.messages.append(Message(sender_id=user.id, body=body.strip()))
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    return _get_conversation_for_user(db, conv.id, user.id)


def get_conversation(db: Session, *, user: User, conversation_id: int) -> Conversation:
    conv = _get_conversation_for_user(db, conversation_id, user.id)
    # Mark the counterparty's messages as read for this viewer.
    changed = False
    for message in conv.messages:
        if message.sender_id != user.id and not message.is_read:
            message.is_read = True
            changed = True
    if changed:
        db.commit()
    return conv


def list_conversations(db: Session, *, user: User) -> list[Conversation]:
    stmt = (
        select(Conversation)
        .where(or_(Conversation.guest_id == user.id, Conversation.host_id == user.id))
        .options(
            selectinload(Conversation.messages),
            selectinload(Conversation.listing).selectinload(Listing.images),
            selectinload(Conversation.guest),
            selectinload(Conversation.host),
        )
        .order_by(Conversation.updated_at.desc())
    )
    return list(db.scalars(stmt).unique().all())


def counterparty_of(conversation: Conversation, user_id: int) -> User:
    return conversation.host if conversation.guest_id == user_id else conversation.guest


def unread_count_for(conversation: Conversation, user_id: int) -> int:
    return sum(1 for m in conversation.messages if m.sender_id != user_id and not m.is_read)
