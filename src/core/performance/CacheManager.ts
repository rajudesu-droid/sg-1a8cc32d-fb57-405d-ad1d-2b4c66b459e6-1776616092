
// ============================================================================
// CACHE MANAGER
// Smart caching for static and semi-static data
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  // Cache TTLs by data type
  private ttls: Record<string, number> = {
    "protocol_metadata": 3600000,     // 1 hour
    "token_metadata": 1800000,        // 30 minutes
    "pool_metadata": 300000,          // 5 minutes
    "whitelist_config": 3600000,      // 1 hour
    "adapter_config": 3600000,        // 1 hour
    "opportunity_snapshot": 60000,    // 1 minute
    "position_snapshot": 30000,       // 30 seconds
    "balance_snapshot": 10000,        // 10 seconds
    "reward_snapshot": 30000,         // 30 seconds
  };

  /**
   * Get cached data
   */
  get<T>(category: string, key: string): T | null {
    const cacheKey = `${category}:${key}`;
    const entry = this.cache.get(cacheKey);

    if (!entry) return null;

    // Check expiration
    if (new Date() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data
   */
  set<T>(category: string, key: string, data: T, customTtl?: number): void {
    const cacheKey = `${category}:${key}`;
    const ttl = customTtl || this.ttls[category] || 60000; // Default 1 minute

    this.cache.set(cacheKey, {
      data,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + ttl),
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(category: string, key: string): void {
    const cacheKey = `${category}:${key}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Invalidate entire category
   */
  invalidateCategory(category: string): void {
    const prefix = `${category}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get or fetch pattern
   */
  async getOrFetch<T>(
    category: string,
    key: string,
    fetcher: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(category, key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const data = await fetcher();
    this.set(category, key, data, customTtl);
    return data;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    categories: Record<string, number>;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const categories: Record<string, number> = {};
    let oldest: Date | null = null;
    let newest: Date | null = null;

    for (const [key, entry] of this.cache.entries()) {
      const category = key.split(":")[0];
      categories[category] = (categories[category] || 0) + 1;

      if (!oldest || entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
      if (!newest || entry.timestamp > newest) {
        newest = entry.timestamp;
      }
    }

    return {
      totalEntries: this.cache.size,
      categories,
      oldestEntry: oldest,
      newestEntry: newest,
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();

// Auto cleanup every 5 minutes
setInterval(() => cacheManager.cleanup(), 300000);
