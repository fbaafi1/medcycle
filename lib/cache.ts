export const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const FETCH_TIMEOUT_MS = 20_000; // 20s — more tolerant on slow mobile networks

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function readCache<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed?.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    /* storage full or unavailable */
  }
}

export function isCacheFresh(timestamp: number, ttl = CACHE_TTL_MS): boolean {
  return Date.now() - timestamp < ttl;
}
