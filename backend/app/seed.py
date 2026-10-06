"""Idempotent database seeding for StayFinder.

Run standalone to drop & reseed:  python -m app.seed
On app startup `seed_if_empty` only seeds an empty database.
"""

from __future__ import annotations

import random
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import (
    Amenity,
    Booking,
    BookingStatus,
    Conversation,
    Favorite,
    Listing,
    ListingImage,
    Message,
    Review,
    User,
    UserRole,
)
from app.services.auth_service import DEMO_GUEST_EMAIL, DEMO_HOST_EMAIL
from app.services.booking_service import _generate_confirmation_code
from app.services.pricing import calculate_price
from app.services.review_service import recompute_aggregates

# Deterministic output across reseeds.
random.seed(42)

UNSPLASH = "https://images.unsplash.com/{pid}?auto=format&fit=crop&w=1200&q=80"

# Pool of stable Unsplash home/interior photo IDs. Each listing cycles a slice of these.
PHOTO_IDS = [
    "photo-1600585154340-be6161a56a0c",
    "photo-1600596542815-ffad4c1539a9",
    "photo-1600607687939-ce8a6c25118c",
    "photo-1600566753086-00f18fb6b3ea",
    "photo-1600047509807-ba8f99d2cdde",
    "photo-1560448204-e02f11c3d0e2",
    "photo-1522708323590-d24dbb6b0267",
    "photo-1502672260266-1c1ef2d93688",
    "photo-1512917774080-9991f1c4c750",
    "photo-1564013799919-ab600027ffc6",
    "photo-1570129477492-45c003edd2be",
    "photo-1484154218962-a197022b5858",
    "photo-1493809842364-78817add7ffb",
    "photo-1522771739844-6a9f6d5f14af",
    "photo-1540518614846-7eded433c457",
    "photo-1505691938895-1758d7feb511",
    "photo-1586023492125-27b2c045efd7",
    "photo-1502005229762-cf1b2da7c5d6",
    "photo-1515263487990-61b07816b324",
    "photo-1507089947368-19c1da9775ae",
    "photo-1512918728675-ed5a9ecdebfd",
    "photo-1449844908441-8829872d2607",
    "photo-1568605114967-8130f3a36994",
    "photo-1580587771525-78b9dba3b914",
    "photo-1613977257363-707ba9348227",
    "photo-1598928506311-c55ded91a20c",
    "photo-1583608205776-bfd35f0d9f83",
    "photo-1521783988139-89397d761dce",
    "photo-1476514525535-07fb3b4ae5f1",
    "photo-1505843513577-22bb7d21e455",
    "photo-1618221195710-dd6b41faaea6",
    "photo-1556909212-d5b604d0c90d",
    "photo-1551963831-b3b1ca40c98e",
    "photo-1558036117-15d82a90b9b1",
]

AMENITIES = [
    ("Wifi", "wifi", "essentials"),
    ("Kitchen", "utensils", "essentials"),
    ("Free parking", "car", "essentials"),
    ("Air conditioning", "wind", "essentials"),
    ("Heating", "thermometer", "essentials"),
    ("Washer", "washing-machine", "essentials"),
    ("Dryer", "wind", "essentials"),
    ("TV", "tv", "entertainment"),
    ("Pool", "waves", "features"),
    ("Hot tub", "bath", "features"),
    ("Gym", "dumbbell", "features"),
    ("Workspace", "laptop", "essentials"),
    ("Pets allowed", "paw-print", "features"),
    ("Fireplace", "flame", "features"),
    ("BBQ grill", "flame-kindling", "features"),
    ("Beach access", "umbrella", "features"),
    ("Mountain view", "mountain", "features"),
    ("Ocean view", "waves", "features"),
    ("Self check-in", "key", "essentials"),
    ("Smoke alarm", "bell-ring", "safety"),
    ("First aid kit", "cross", "safety"),
    ("EV charger", "plug-zap", "features"),
]

PROPERTY_TYPES = ["Apartment", "House", "Villa", "Cabin", "Loft", "Cottage", "Tiny home", "Guesthouse"]

CATEGORIES = [
    "Trending", "Beachfront", "Cabins", "Amazing views", "Luxe",
    "Countryside", "Tropical", "Design", "Lakefront", "City",
]

# (title, city, country, lat, lng, property_type, category, price_usd, guests, bedrooms, beds, baths)
LISTING_SPECS = [
    ("Sun-drenched villa with infinity pool", "Santorini", "Greece", 36.393, 25.461, "Villa", "Luxe", 420, 6, 3, 4, 2.5),
    ("Modern loft in the heart of the city", "New York", "United States", 40.758, -73.985, "Loft", "City", 215, 2, 1, 1, 1.0),
    ("Beachfront bungalow steps from the sand", "Tulum", "Mexico", 20.211, -87.465, "House", "Beachfront", 310, 4, 2, 3, 2.0),
    ("Cozy alpine cabin with fireplace", "Aspen", "United States", 39.191, -106.817, "Cabin", "Cabins", 275, 5, 2, 3, 1.5),
    ("Design-forward apartment near the canals", "Amsterdam", "Netherlands", 52.370, 4.895, "Apartment", "Design", 190, 3, 1, 2, 1.0),
    ("Tropical treehouse retreat", "Ubud", "Indonesia", -8.519, 115.263, "Guesthouse", "Tropical", 160, 2, 1, 1, 1.0),
    ("Lakefront cottage with private dock", "Queenstown", "New Zealand", -45.031, 168.662, "Cottage", "Lakefront", 240, 6, 3, 4, 2.0),
    ("Minimalist tiny home in the hills", "Byron Bay", "Australia", -28.643, 153.612, "Tiny home", "Countryside", 135, 2, 1, 1, 1.0),
    ("Historic townhouse with rooftop terrace", "Lisbon", "Portugal", 38.722, -9.139, "House", "City", 205, 5, 2, 3, 2.0),
    ("Cliffside villa with panoramic ocean views", "Positano", "Italy", 40.628, 14.485, "Villa", "Amazing views", 530, 8, 4, 5, 3.5),
    ("Scandinavian loft with floor-to-ceiling windows", "Copenhagen", "Denmark", 55.676, 12.568, "Loft", "Design", 225, 3, 1, 2, 1.0),
    ("Secluded forest cabin with hot tub", "Whistler", "Canada", 50.116, -122.957, "Cabin", "Cabins", 290, 4, 2, 2, 2.0),
    ("Bright apartment overlooking the bay", "San Francisco", "United States", 37.808, -122.417, "Apartment", "City", 260, 2, 1, 1, 1.0),
    ("Whitewashed cave house with sea view", "Oia", "Greece", 36.461, 25.376, "House", "Amazing views", 380, 4, 2, 2, 2.0),
    ("Palm-shaded pool villa", "Seminyak", "Indonesia", -8.690, 115.168, "Villa", "Tropical", 345, 6, 3, 3, 3.0),
    ("Charming cottage in the countryside", "Cotswolds", "United Kingdom", 51.833, -1.843, "Cottage", "Countryside", 175, 4, 2, 2, 1.5),
    ("Sleek studio in the design district", "Barcelona", "Spain", 41.390, 2.154, "Apartment", "Design", 150, 2, 1, 1, 1.0),
    ("Mountain chalet with ski-in access", "Zermatt", "Switzerland", 46.020, 7.749, "Cabin", "Amazing views", 460, 8, 4, 5, 3.0),
    ("Lakeside A-frame getaway", "Lake Tahoe", "United States", 39.096, -120.032, "Cabin", "Lakefront", 320, 6, 3, 3, 2.0),
    ("Penthouse with skyline views", "Dubai", "United Arab Emirates", 25.197, 55.274, "Apartment", "Luxe", 610, 4, 2, 2, 2.5),
    ("Rustic farmhouse among the vineyards", "Tuscany", "Italy", 43.771, 11.254, "House", "Countryside", 230, 7, 4, 4, 3.0),
    ("Overwater bungalow on the lagoon", "Bora Bora", "French Polynesia", -16.500, -151.741, "Guesthouse", "Beachfront", 720, 2, 1, 1, 1.0),
    ("Industrial loft with exposed brick", "Berlin", "Germany", 52.520, 13.405, "Loft", "City", 165, 3, 1, 2, 1.0),
    ("Glass cabin under the northern lights", "Reykjavik", "Iceland", 64.147, -21.942, "Cabin", "Amazing views", 395, 2, 1, 1, 1.0),
    ("Beach villa with private garden", "Phuket", "Thailand", 7.890, 98.298, "Villa", "Tropical", 280, 8, 4, 5, 4.0),
    ("Sunny apartment near the old town", "Prague", "Czechia", 50.087, 14.421, "Apartment", "City", 120, 4, 2, 2, 1.0),
    ("Desert dome with stargazing deck", "Joshua Tree", "United States", 34.135, -116.313, "Tiny home", "Amazing views", 185, 2, 1, 1, 1.0),
    ("Coastal cottage with ocean breeze", "Cape Town", "South Africa", -33.925, 18.423, "Cottage", "Beachfront", 210, 5, 2, 3, 2.0),
    ("Luxe villa with home cinema", "Marbella", "Spain", 36.510, -4.886, "Villa", "Luxe", 540, 10, 5, 6, 4.5),
    ("Quiet retreat by the rice fields", "Chiang Mai", "Thailand", 18.788, 98.985, "Guesthouse", "Countryside", 95, 2, 1, 1, 1.0),
    ("Converted barn with modern interiors", "Hudson Valley", "United States", 41.900, -73.700, "House", "Countryside", 245, 6, 3, 4, 2.0),
    ("Downtown apartment with city balcony", "Tokyo", "Japan", 35.690, 139.700, "Apartment", "City", 200, 3, 1, 2, 1.0),
]

DESCRIPTIONS = [
    "Wake up to incredible light pouring through oversized windows. This thoughtfully designed "
    "space pairs natural materials with modern comforts, just minutes from the best the area "
    "has to offer. Ideal for both relaxed mornings and easy exploring.",
    "A calm, uncluttered home built for slow stays. Cook in the fully equipped kitchen, unwind "
    "in the living room, and step outside to take in the surroundings. Everything you need is "
    "within reach, and the hosts are always a message away.",
    "Perched in one of the most sought-after spots in the region, this place is all about the "
    "view and the quiet. Spacious, bright, and tastefully furnished, it's a favorite for couples "
    "and small groups looking to recharge.",
    "Stylish and welcoming, with a layout that works just as well for a weekend escape as a "
    "longer stay. Thoughtful touches throughout, a comfortable bed, and a location that keeps "
    "you close to everything while still feeling like a retreat.",
]

REVIEW_TEXTS = [
    "Absolutely stunning place — the photos don't do it justice. We'd stay again in a heartbeat.",
    "Spotless, beautifully designed, and the host was incredibly responsive. Highly recommend.",
    "Perfect location and the views were unreal. Checkout was a breeze with self check-in.",
    "Comfortable beds, great kitchen, and everything was exactly as described. Loved it.",
    "A quiet gem. We came to relax and this was the ideal spot. Thank you for a lovely stay!",
    "Great value for the area. The space is even nicer in person and super clean.",
    "The host went above and beyond with local recommendations. Can't wait to come back.",
    "Gorgeous interiors and a thoughtful welcome. One of our best Airbnb-style stays yet.",
    "Everything ran smoothly from booking to checkout. The place felt like home.",
    "Woke up to the most beautiful light every morning. Already planning our next trip here.",
]

REVIEWER_NAMES = [
    "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mateo",
    "Isabella", "Lucas", "Mia", "Arjun", "Priya", "Chen", "Yuki", "Fatima",
]

STREET_NAMES = [
    "Marina Way", "Cliffside Road", "Orchard Lane", "Harbor View", "Sunset Boulevard",
    "Juniper Street", "Maple Court", "Seaside Terrace", "Vineyard Path", "Birchwood Drive",
    "Lantern Alley", "Coral Crescent", "Old Mill Road", "Garden Close", "Pine Hollow",
]

AREA_DESCRIPTIONS = [
    "A quiet, walkable pocket of the area — independent cafes, bakeries and a weekend market "
    "are a few minutes away, with the main sights an easy stroll or short ride from the door.",
    "Set just back from the busier streets, the neighborhood stays peaceful in the evenings "
    "while keeping restaurants, shops and transit within comfortable reach.",
    "A relaxed, leafy residential street with a genuine local feel — close enough to the action, "
    "far enough to properly unwind.",
    "Tucked into a scenic stretch that locals love, with standout views, nearby trails or "
    "waterfront, and a handful of great places to eat close by.",
]

HOST_LANGUAGES = [
    "English", "English, Spanish", "English, French", "English, Mandarin",
    "English, Portuguese", "English, German, Italian",
]
RESPONSE_TIMES = ["within an hour", "within a few hours", "within a day"]

# (name, is_superhost, bio) for additional hosts so no single host owns the marketplace.
EXTRA_HOST_SPECS = [
    ("Mara Lindqvist", True, "Designing calm, light-filled homes in the north."),
    ("Diego Herrera", False, "Weekend host sharing a couple of favorite city stays."),
    ("Aisha Khan", True, "Hospitality runs in the family — you're very welcome."),
    ("Tomás Rocha", False, "Coastal cottages and slow mornings by the water."),
]


def _avatar(seed: str) -> str:
    return f"https://i.pravatar.cc/200?u={seed}"


def _photos_for(index: int) -> list[str]:
    start = (index * 3) % len(PHOTO_IDS)
    picked = [PHOTO_IDS[(start + offset) % len(PHOTO_IDS)] for offset in range(5)]
    return [UNSPLASH.format(pid=pid) for pid in picked]


def _clear_all(db: Session) -> None:
    for model in (Message, Conversation, Favorite, Review, Booking, ListingImage, Listing, Amenity, User):
        db.query(model).delete()
    db.commit()


def seed(db: Session) -> None:
    _clear_all(db)

    # --- Amenities ---
    amenities = [Amenity(name=n, icon=i, category=c) for (n, i, c) in AMENITIES]
    db.add_all(amenities)
    db.flush()

    # --- Primary demo users (switcher) ---
    guest = User(
        name="Alex Morgan",
        email=DEMO_GUEST_EMAIL,
        avatar_url=_avatar("alex"),
        role=UserRole.GUEST,
        is_demo_switchable=True,
        bio="Weekend explorer and coffee enthusiast.",
    )
    host_sofia = User(
        name="Sofia Ramos",
        email=DEMO_HOST_EMAIL,
        avatar_url=_avatar("sofia"),
        role=UserRole.HOST,
        is_superhost=True,
        is_demo_switchable=True,
        bio="Superhost sharing sunny homes across the Mediterranean.",
        host_since_year=2017,
        response_rate=100,
        response_time="within an hour",
        languages="English, Spanish, Portuguese",
    )
    host_daniel = User(
        name="Daniel Kim",
        email="daniel@stayfinder.demo",
        avatar_url=_avatar("daniel"),
        role=UserRole.HOST,
        is_superhost=True,
        is_demo_switchable=True,
        bio="Designing calm, considered spaces for travelers.",
        host_since_year=2019,
        response_rate=98,
        response_time="within a few hours",
        languages="English, Mandarin",
    )

    extra_hosts = [
        User(
            name=name,
            email=f"host.{name.split()[0].lower()}@stayfinder.demo",
            avatar_url=_avatar(name),
            role=UserRole.HOST,
            is_superhost=is_super,
            bio=bio,
            host_since_year=random.randint(2015, 2023),
            response_rate=random.randint(86, 100),
            response_time=random.choice(RESPONSE_TIMES),
            languages=random.choice(HOST_LANGUAGES),
        )
        for (name, is_super, bio) in EXTRA_HOST_SPECS
    ]

    db.add_all([guest, host_sofia, host_daniel, *extra_hosts])

    # --- Reviewer users ---
    reviewers = [
        User(
            name=name,
            email=f"reviewer{idx}@stayfinder.demo",
            avatar_url=_avatar(f"rev{idx}"),
            role=UserRole.GUEST,
        )
        for idx, name in enumerate(REVIEWER_NAMES)
    ]
    db.add_all(reviewers)
    db.flush()

    # Sofia and Daniel (demo hosts) lead the rotation so they showcase ~6 listings each;
    # the rest spread across the other hosts so no single host owns the marketplace.
    hosts = [host_sofia, host_daniel, *extra_hosts]

    # --- Listings ---
    listings: list[Listing] = []
    for index, spec in enumerate(LISTING_SPECS):
        (title, city, country, lat, lng, ptype, category, price, guests_n,
         bedrooms, beds, baths) = spec
        host = hosts[index % len(hosts)]
        listing = Listing(
            host_id=host.id,
            title=title,
            description=random.choice(DESCRIPTIONS),
            city=city,
            country=country,
            address=f"{random.randint(2, 240)} {random.choice(STREET_NAMES)}, {city}, {country}",
            area_description=random.choice(AREA_DESCRIPTIONS),
            latitude=lat,
            longitude=lng,
            nightly_price_cents=price * 100,
            cleaning_fee_cents=random.choice([3500, 4500, 6000, 7500]),
            max_guests=guests_n,
            bedrooms=bedrooms,
            beds=beds,
            bathrooms=baths,
            property_type=ptype,
            category=category,
            check_in_time=random.choice(["2:00 PM", "3:00 PM", "4:00 PM"]),
            check_out_time=random.choice(["10:00 AM", "11:00 AM", "12:00 PM"]),
        )
        for order, url in enumerate(_photos_for(index)):
            listing.images.append(ListingImage(url=url, sort_order=order, alt_text=title))
        # 5–9 amenities per listing, always including the essentials.
        essential = [a for a in amenities if a.category == "essentials"][:3]
        extras = random.sample(amenities, k=random.randint(4, 7))
        listing.amenities = list({a.id: a for a in essential + extras}.values())
        listings.append(listing)
        db.add(listing)
    db.flush()

    # --- Reviews ---
    for listing in listings:
        count = random.randint(3, 9)
        chosen_reviewers = random.sample(reviewers, k=min(count, len(reviewers)))
        for reviewer in chosen_reviewers:
            db.add(
                Review(
                    listing_id=listing.id,
                    user_id=reviewer.id,
                    rating=random.choices([5, 4, 3], weights=[7, 2, 1])[0],
                    comment=random.choice(REVIEW_TEXTS),
                    created_at=_days_ago(random.randint(10, 400)),
                )
            )
    db.flush()

    # --- Existing bookings (seed availability conflicts + trips) ---
    _seed_bookings(db, listings, guest, reviewers)

    db.commit()

    # Recompute denormalized rating/review_count from reviews.
    for listing in listings:
        recompute_aggregates(db, listing.id)
        db.refresh(listing)

    # Award "Guest favorite" selectively — the top well-reviewed listings only, so the
    # badge is meaningful rather than decorative (roughly the top quarter).
    eligible = sorted(
        (lst for lst in listings if lst.review_count >= 5),
        key=lambda lst: (lst.rating, lst.review_count),
        reverse=True,
    )
    favorite_ids = {lst.id for lst in eligible[:8]}
    for listing in listings:
        listing.is_guest_favorite = listing.id in favorite_ids
    db.commit()

    # --- Favorites for the primary guest ---
    for listing in listings[:4]:
        db.add(Favorite(user_id=guest.id, listing_id=listing.id))
    db.commit()

    _seed_conversations(db, listings, guest)


def _days_ago(n: int):
    from datetime import datetime, timezone

    return datetime.now(timezone.utc) - timedelta(days=n)


def _add_booking(
    db: Session, *, listing: Listing, guest_id: int, check_in: date, check_out: date,
    guests: int, status: str,
) -> None:
    breakdown = calculate_price(
        nightly_rate_cents=listing.nightly_price_cents,
        cleaning_fee_cents=listing.cleaning_fee_cents,
        check_in=check_in,
        check_out=check_out,
    )
    db.add(
        Booking(
            listing_id=listing.id,
            guest_id=guest_id,
            check_in=check_in,
            check_out=check_out,
            guest_count=guests,
            status=status,
            nightly_rate_snapshot_cents=breakdown.nightly_rate_cents,
            night_count=breakdown.night_count,
            cleaning_fee_cents=breakdown.cleaning_fee_cents,
            service_fee_cents=breakdown.service_fee_cents,
            taxes_cents=breakdown.taxes_cents,
            total_cents=breakdown.total_cents,
            confirmation_code=_generate_confirmation_code(db),
        )
    )


def _seed_bookings(
    db: Session, listings: list[Listing], guest: User, reviewers: list[User]
) -> None:
    today = date.today()

    # Future bookings by other guests on several listings → create blocked dates to demo
    # availability conflicts on the detail calendars.
    for offset, listing in enumerate(listings[:12]):
        start = today + timedelta(days=14 + offset * 2)
        _add_booking(
            db, listing=listing, guest_id=reviewers[offset % len(reviewers)].id,
            check_in=start, check_out=start + timedelta(days=4),
            guests=2, status=BookingStatus.CONFIRMED,
        )

    # The primary demo guest: an upcoming trip, a past trip, and a cancelled one.
    _add_booking(
        db, listing=listings[5], guest_id=guest.id,
        check_in=today + timedelta(days=30), check_out=today + timedelta(days=35),
        guests=2, status=BookingStatus.CONFIRMED,
    )
    _add_booking(
        db, listing=listings[8], guest_id=guest.id,
        check_in=today - timedelta(days=40), check_out=today - timedelta(days=36),
        guests=3, status=BookingStatus.CONFIRMED,
    )
    _add_booking(
        db, listing=listings[2], guest_id=guest.id,
        check_in=today + timedelta(days=60), check_out=today + timedelta(days=63),
        guests=2, status=BookingStatus.CANCELLED,
    )


def _seed_conversations(db: Session, listings: list[Listing], guest: User) -> None:
    from datetime import datetime, timezone

    threads = [
        (
            listings[0],
            [
                (guest.id, "Hi! We're hoping to arrive a little early — would an 11am check-in be possible?"),
                (listings[0].host_id, "Hi Alex! I can usually arrange early check-in if the place is ready. I'll confirm the day before — looking forward to hosting you!"),
                (guest.id, "Amazing, thank you so much."),
            ],
        ),
        (
            listings[1],
            [
                (guest.id, "Is it quiet in the evenings? It's partly a work trip so I'll need to focus a little."),
                (listings[1].host_id, "Very quiet, and there's a proper desk by the window with great light. You'll be comfortable."),
            ],
        ),
    ]
    base = datetime.now(timezone.utc) - timedelta(days=3)
    for listing, msgs in threads:
        conv = Conversation(
            listing_id=listing.id, guest_id=guest.id, host_id=listing.host_id, created_at=base
        )
        db.add(conv)
        db.flush()
        for i, (sender_id, body) in enumerate(msgs):
            conv.messages.append(
                Message(sender_id=sender_id, body=body, created_at=base + timedelta(hours=i * 6))
            )
        conv.updated_at = base + timedelta(hours=len(msgs) * 6)
    db.commit()


def seed_if_empty(db: Session) -> None:
    if db.scalar(select(User.id).limit(1)) is None:
        seed(db)


def reseed() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed(db)
    print("Database reseeded.")


if __name__ == "__main__":
    reseed()
