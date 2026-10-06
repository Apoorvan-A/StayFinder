const KEY = "stayfinder.recentlyViewed";
const MAX = 12;

export function addRecentlyViewed(listingId: number): void {
  try {
    const current = getRecentlyViewed().filter((id) => id !== listingId);
    const next = [listingId, ...current].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

export function getRecentlyViewed(): number[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}
