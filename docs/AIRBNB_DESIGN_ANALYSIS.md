# Airbnb Design Analysis → Implementation Rules

Actionable tokens derived from Airbnb's current web product. These feed `tailwind.config.ts`
and `globals.css`. Airbnb is a visual/UX reference only; all code and assets here are original.

## Color
- Primary / "Rausch": `#FF385C` (CTAs, active rating heart, brand). Hover `#E00B41` / darken.
- Primary gradient on reserve button hover: subtle darken, no flashy gradients.
- Text: near-black `#222222` primary, `#717171` secondary, `#6A6A6A` muted.
- Borders: `#DDDDDD` (hairline), `#EBEBEB` (dividers).
- Background: `#FFFFFF`; subtle surface `#F7F7F7`.
- Rating star fill: `#222222` (Airbnb uses black star, not gold).

## Typography
- Airbnb uses "Cereal"; we approximate with a clean system/Inter stack.
- Scale: card title 15px/600, price 15px/600, secondary 15px/400 `#717171`.
- Listing detail H1 ~26–32px/600. Section headings 22px/600.
- Line-height generous; letter-spacing default.

## Layout & spacing
- Page max content width ~1280px (`max-w-[1280px]`), with responsive horizontal padding:
  mobile 24px, ≥768 40px, ≥1128 80px (`px-6 md:px-10 xl:px-20`).
- Navbar height ~80px desktop, sticky, hairline bottom border, white.
- Spacing scale: 4/8/12/16/24/32/48.

## Listing cards (grid)
- Image aspect ratio **1:1** (square), `rounded-xl` (~12px), object-cover.
- Heart top-right overlay; image carousel dots on hover (desktop).
- Below image: row1 title (truncate) + rating (★ + value right-aligned);
  row2 secondary location/text `#717171`; row3 dates/distance; row4 **price/night** bold + " night".
- Card gap ~24px (`gap-6`), no card border/shadow (flat, image-forward).
- Grid columns: 1 (xs) → 2 (sm) → 3 (md) → 4 (lg) → 5 (xl)… we cap at 4–5.

## Category row
- Horizontal scroll strip under navbar: icon + label, active has black underline + bold.
- ~56–64px tall, subtle fade at edges.

## Search bar
- Collapsed: single pill, segments "Anywhere · Any week · Add guests", shadow on rest,
  bigger shadow on hover. Magnifier primary-colored circle button on the right.
- Expanded: segmented (Where / Check in / Check out / Who) with popovers (calendar, guests).
- Mobile: condensed pill triggering a full-screen search sheet.

## Listing detail
- H1 title; subrow: ★ rating · reviews · location (underlined). Share + Save right.
- Gallery: 1 hero left (2x2 area) + 4 thumbnails right, `rounded-xl`, 8px gaps,
  "Show all photos" button bottom-right. Mobile: single swipeable image.
- Two-column body: left content, right **sticky reservation card** (border `#DDDDDD`,
  `rounded-xl`, shadow, price/night, date & guest pickers, Reserve CTA, price breakdown,
  "You won't be charged yet").
- Sections: overview stats, host, divider, description, amenities grid (+ show all modal),
  calendar, reviews (summary + grid), map.

## Radii & shadows
- Cards/images `rounded-xl` (12px); modals `rounded-2xl`; buttons `rounded-lg`/pill.
- Shadows: soft, low-spread (`0 6px 16px rgba(0,0,0,0.12)` for reservation card / search rest).

## Interaction
- Heart: scale pop + fill on favorite.
- Buttons: slight darken + scale(0.97) active.
- Skeletons: rounded shimmer blocks matching card geometry.
- Modals: centered, max ~`max-w-2xl`, scroll-locked, Esc to close, focus trap.

## Breakpoints
`sm 640 · md 768 · lg 1024 · xl 1280`. Reservation card hidden on mobile; replaced by a
sticky bottom bar (price + Reserve).
