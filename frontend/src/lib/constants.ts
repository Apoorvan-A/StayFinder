export const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Villa",
  "Cabin",
  "Loft",
  "Cottage",
  "Tiny home",
  "Guesthouse",
] as const;

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const;

export const PAGE_SIZE = 24;

// A single, coherent cancellation policy that matches the backend's behavior
// (cancellation is allowed up until the check-in date).
export const CANCELLATION_POLICY = {
  title: "Free cancellation before check-in",
  summary:
    "Cancel any time before your check-in date at no cost. Once check-in begins, the reservation can no longer be cancelled. StayFinder is a demo, so no real charges ever apply.",
};
