/**
 * Client-Side Stale-While-Revalidate (SWR) Session Cache
 * Provides instant (0ms) page navigation and catalog rendering from sessionStorage
 * while silently refreshing in the background.
 */

interface CacheWrapper<T> {
  data: T;
  timestamp: number;
}

export function getSessionCache<T>(key: string, maxAgeMs = 5 * 60 * 1000): { data: T; isStale: boolean } | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed: CacheWrapper<T> = JSON.parse(raw);
    const age = Date.now() - (parsed.timestamp || 0);
    return {
      data: parsed.data,
      isStale: age > maxAgeMs,
    };
  } catch (_e) {
    return null;
  }
}

export function setSessionCache<T>(key: string, data: T): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    const payload: CacheWrapper<T> = {
      data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(key, JSON.stringify(payload));
  } catch (_e) {
    // sessionStorage quota exceeded or disabled in private browsing
  }
}

export function clearSessionCachePrefix(prefix: string): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch (_e) {}
}
