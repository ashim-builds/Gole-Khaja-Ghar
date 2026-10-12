/**
 * Zero-dependency in-memory TTL cache with bounded memory protection (LRU-eviction).
 * Designed for low-resource CloudLinux LVE shared hosting environments.
 */

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxEntries: number;

  constructor(maxEntries = 150) {
    this.maxEntries = maxEntries;
  }

  /**
   * Retrieves an entry if present and not expired.
   */
  get<T = any>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    entry.lastAccessed = now;
    return entry.value as T;
  }

  /**
   * Sets an entry with a TTL in seconds.
   */
  set<T = any>(key: string, value: T, ttlSeconds: number): void {
    const now = Date.now();

    // Guard against memory leaks: enforce maxEntries bound
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      this.evict();
    }

    this.cache.set(key, {
      value,
      expiresAt: now + ttlSeconds * 1000,
      lastAccessed: now,
    });
  }

  /**
   * Deletes a specific key.
   */
  del(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate entries matching a prefix.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate entries matching regex or wildcard pattern.
   */
  invalidatePattern(pattern: RegExp | string): void {
    const regex = typeof pattern === 'string'
      ? new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
      : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears all cache entries.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Evicts expired items first, then oldest accessed items.
   */
  private evict(): void {
    const now = Date.now();
    let evictedCount = 0;

    // Phase 1: remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        evictedCount++;
      }
    }

    // Phase 2: if still over limit, drop oldest accessed entries
    if (this.cache.size >= this.maxEntries) {
      const sortedKeys = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
        .slice(0, Math.ceil(this.maxEntries * 0.2)) // evict 20%
        .map(([k]) => k);

      for (const k of sortedKeys) {
        this.cache.delete(k);
      }
    }
  }

  /**
   * Diagnostics
   */
  size(): number {
    return this.cache.size;
  }
}

// Global shared singleton cache instance
export const routeCache = new MemoryCache(200);

/**
 * Invalidation helpers
 */
export function invalidateProductsCache(): void {
  routeCache.invalidatePrefix('products:');
  routeCache.invalidatePrefix('categories:');
}

export function invalidateStoreCache(): void {
  routeCache.invalidatePrefix('store:');
}

export default routeCache;
