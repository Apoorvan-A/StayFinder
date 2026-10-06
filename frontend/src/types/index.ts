export type Role = "guest" | "host";

export interface User {
  id: number;
  name: string;
  avatar_url: string | null;
  role: Role;
  is_superhost: boolean;
  bio: string | null;
}

export interface ListingImage {
  id: number;
  url: string;
  alt_text: string;
  sort_order: number;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string;
  category: string;
}

export interface ListingCard {
  id: number;
  title: string;
  city: string;
  country: string;
  property_type: string;
  category: string;
  nightly_price_cents: number;
  rating: number;
  review_count: number;
  is_guest_favorite: boolean;
  max_guests: number;
  bedrooms: number;
  beds: number;
  latitude: number | null;
  longitude: number | null;
  images: ListingImage[];
  is_favorited: boolean;
}

export interface ListingDetail extends ListingCard {
  description: string;
  address: string | null;
  bathrooms: number;
  cleaning_fee_cents: number;
  host: User;
  amenities: Amenity[];
}

export interface Page<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface BookedRange {
  check_in: string;
  check_out: string;
}

export interface Availability {
  listing_id: number;
  booked_ranges: BookedRange[];
}

export interface PriceQuote {
  listing_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  available: boolean;
  nightly_rate_cents: number;
  night_count: number;
  accommodation_cents: number;
  cleaning_fee_cents: number;
  service_fee_cents: number;
  taxes_cents: number;
  total_cents: number;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Booking {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guest_count: number;
  status: BookingStatus;
  nightly_rate_snapshot_cents: number;
  night_count: number;
  cleaning_fee_cents: number;
  service_fee_cents: number;
  taxes_cents: number;
  total_cents: number;
  confirmation_code: string;
  created_at: string;
}

export interface Trip extends Booking {
  listing: ListingCard;
}

export interface HostReservation extends Booking {
  listing: ListingCard;
  guest: User;
}

export interface HostMetrics {
  active_listings: number;
  total_reservations: number;
  upcoming_reservations: number;
  revenue_cents: number;
  average_rating: number;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  author: User;
}

export interface ReviewSummary {
  rating: number;
  review_count: number;
  reviews: Review[];
}
