import { storage } from '../utils/storage';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry?: number; // TTL in milliseconds
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  prefix?: string;
}

class CacheService {
  private static instance: CacheService;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default
  private keyPrefix = 'lazycoach_cache_';

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private buildKey(key: string, prefix?: string): string {
    const finalPrefix = prefix || this.keyPrefix;
    return `${finalPrefix}${key}`;
  }

  async set<T>(
    key: string, 
    data: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const { ttl = this.defaultTTL } = options;
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry: ttl > 0 ? Date.now() + ttl : undefined,
      };

      const cacheKey = this.buildKey(key, options.prefix);
      await storage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('CacheService: Failed to set cache entry', error);
    }
  }

  async get<T>(
    key: string, 
    options: CacheOptions = {}
  ): Promise<T | null> {
    try {
      const cacheKey = this.buildKey(key, options.prefix);
      const cachedItem = await storage.getItem(cacheKey);
      
      if (!cachedItem) {
        return null;
      }

      const cacheEntry: CacheEntry<T> = JSON.parse(cachedItem);
      
      // Check if cache entry has expired
      if (cacheEntry.expiry && Date.now() > cacheEntry.expiry) {
        await this.remove(key, options);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('CacheService: Failed to get cache entry', error);
      return null;
    }
  }

  async remove(key: string, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.buildKey(key, options.prefix);
      await storage.removeItem(cacheKey);
    } catch (error) {
      console.error('CacheService: Failed to remove cache entry', error);
    }
  }

  async clear(prefix?: string): Promise<void> {
    try {
      const finalPrefix = prefix || this.keyPrefix;
      const keys = await storage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(finalPrefix));
      
      if (cacheKeys.length > 0) {
        await storage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('CacheService: Failed to clear cache', error);
    }
  }

  async getMultiple<T>(
    keys: string[], 
    options: CacheOptions = {}
  ): Promise<Array<T | null>> {
    try {
      const cacheKeys = keys.map(key => this.buildKey(key, options.prefix));
      const items = await storage.multiGet(cacheKeys);
      
      return items.map(([, value]: [string, string | null]) => {
        if (!value) return null;
        
        try {
          const cacheEntry: CacheEntry<T> = JSON.parse(value);
          
          // Check expiry
          if (cacheEntry.expiry && Date.now() > cacheEntry.expiry) {
            return null;
          }
          
          return cacheEntry.data;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('CacheService: Failed to get multiple cache entries', error);
      return keys.map(() => null);
    }
  }

  async setMultiple<T>(
    entries: Array<{ key: string; data: T }>, 
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const { ttl = this.defaultTTL } = options;
      const keyValuePairs: Array<[string, string]> = entries.map(({ key, data }) => {
        const cacheEntry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          expiry: ttl > 0 ? Date.now() + ttl : undefined,
        };
        
        const cacheKey = this.buildKey(key, options.prefix);
        return [cacheKey, JSON.stringify(cacheEntry)];
      });

      await storage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('CacheService: Failed to set multiple cache entries', error);
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cachedData = await this.get(key, options);
      return cachedData !== null;
    } catch {
      return false;
    }
  }

  async getStats(): Promise<{
    totalKeys: number;
    cacheKeys: number;
    totalSize: string;
  }> {
    try {
      const allKeys = await storage.getAllKeys();
      const cacheKeys = allKeys.filter((key: string) => key.startsWith(this.keyPrefix));
      
      // Get all cache entries to calculate size
      const cacheEntries = await storage.multiGet(cacheKeys);
      const totalSize = cacheEntries.reduce((size: number, [, value]: [string, string | null]) => {
        return size + (value ? new Blob([value]).size : 0);
      }, 0);

      return {
        totalKeys: allKeys.length,
        cacheKeys: cacheKeys.length,
        totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      };
    } catch (error) {
      console.error('CacheService: Failed to get stats', error);
      return { totalKeys: 0, cacheKeys: 0, totalSize: '0 KB' };
    }
  }

  // Cleanup expired entries
  async cleanup(): Promise<number> {
    try {
      const allKeys = await storage.getAllKeys();
      const cacheKeys = allKeys.filter((key: string) => key.startsWith(this.keyPrefix));
      
      if (cacheKeys.length === 0) return 0;

      const cacheEntries = await storage.multiGet(cacheKeys);
      const expiredKeys: string[] = [];
      
      cacheEntries.forEach(([key, value]: [string, string | null]) => {
        if (value) {
          try {
            const cacheEntry: CacheEntry<any> = JSON.parse(value);
            if (cacheEntry.expiry && Date.now() > cacheEntry.expiry) {
              expiredKeys.push(key);
            }
          } catch {
            // Invalid entry, mark for removal
            expiredKeys.push(key);
          }
        }
      });

      if (expiredKeys.length > 0) {
        await storage.multiRemove(expiredKeys);
      }

      return expiredKeys.length;
    } catch (error) {
      console.error('CacheService: Failed to cleanup expired entries', error);
      return 0;
    }
  }
}

export default CacheService.getInstance();