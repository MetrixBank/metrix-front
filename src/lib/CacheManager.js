// Simple in-memory cache with localStorage persistence for specific keys
const CACHE_PREFIX = 'metrix_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

class CacheManager {
    constructor() {
        this.memoryCache = new Map();
    }

    getKey(key) {
        return `${CACHE_PREFIX}${key}`;
    }

    set(key, value, ttl = DEFAULT_TTL) {
        const item = {
            value,
            expiry: Date.now() + ttl,
        };
        
        // Save to memory
        this.memoryCache.set(key, item);
        
        // Save to localStorage
        try {
            localStorage.setItem(this.getKey(key), JSON.stringify(item));
        } catch (e) {
            console.warn('CacheManager: Failed to save to localStorage', e);
        }
    }

    get(key) {
        const now = Date.now();
        
        // Check memory first
        if (this.memoryCache.has(key)) {
            const item = this.memoryCache.get(key);
            if (item.expiry > now) {
                return item.value;
            } else {
                this.memoryCache.delete(key);
                this.removeFromStorage(key);
                return null;
            }
        }

        // Check localStorage
        try {
            const stored = localStorage.getItem(this.getKey(key));
            if (!stored) return null;

            const item = JSON.parse(stored);
            if (item.expiry > now) {
                this.memoryCache.set(key, item); // Hydrate memory
                return item.value;
            } else {
                this.removeFromStorage(key);
                return null;
            }
        } catch (e) {
            console.warn('CacheManager: Failed to read from localStorage', e);
            return null;
        }
    }

    invalidate(key) {
        this.memoryCache.delete(key);
        this.removeFromStorage(key);
    }

    invalidatePattern(pattern) {
        // Invalidate memory keys
        for (const key of this.memoryCache.keys()) {
            if (key.includes(pattern)) {
                this.memoryCache.delete(key);
            }
        }

        // Invalidate localStorage keys
        Object.keys(localStorage).forEach((storageKey) => {
             if (storageKey.startsWith(CACHE_PREFIX) && storageKey.includes(pattern)) {
                 localStorage.removeItem(storageKey);
             }
        });
    }

    removeFromStorage(key) {
        localStorage.removeItem(this.getKey(key));
    }
    
    clearAll() {
        this.memoryCache.clear();
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
}

export const cacheManager = new CacheManager();