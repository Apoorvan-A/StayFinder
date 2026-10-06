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
