// In-memory cache implementation (works without external dependencies)
interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const MAX_CACHED_VIDEOS = 5;
const CACHE_TTL_SECONDS = 300; // 5 minutes
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;

let cachedVideoIds: number[] = [];

// Cleanup expired entries periodically
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}, 60000); // Run every minute

export const initializeRedis = async (): Promise<void> => {
  console.log('✓ In-memory cache initialized');
};

export const getRedisClient = (): null => {
  return null; // Using in-memory cache, no client needed
};

export const cacheVideo = async (videoId: number, videoData: unknown): Promise<void> => {
  try {
    const cacheKey = `video:${videoId}`;
    const expiresAt = Date.now() + CACHE_TTL_MS;
    
    cache.set(cacheKey, { data: videoData, expiresAt });
    
    // Maintain list of cached video IDs (max 5)
    if (!cachedVideoIds.includes(videoId)) {
      cachedVideoIds.unshift(videoId);
      if (cachedVideoIds.length > MAX_CACHED_VIDEOS) {
        const removed = cachedVideoIds.pop();
        if (removed) {
          cache.delete(`video:${removed}`);
        }
      }
    }
  } catch (err) {
    console.warn('Error caching video:', err instanceof Error ? err.message : err);
  }
};

export const getCachedVideo = async (videoId: number): Promise<unknown | null> => {
  try {
    const cacheKey = `video:${videoId}`;
    const entry = cache.get(cacheKey);
    
    if (!entry) return null;
    
    // Check if expired
    if (entry.expiresAt < Date.now()) {
      cache.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  } catch (err) {
    console.warn('Error retrieving cached video:', err instanceof Error ? err.message : err);
    return null;
  }
};

export const cacheFeed = async (feedData: unknown): Promise<void> => {
  try {
    const cacheKey = 'feed:latest';
    const expiresAt = Date.now() + CACHE_TTL_MS;
    cache.set(cacheKey, { data: feedData, expiresAt });
  } catch (err) {
    console.warn('Error caching feed:', err instanceof Error ? err.message : err);
  }
};

export const getCachedFeed = async (): Promise<unknown | null> => {
  try {
    const cacheKey = 'feed:latest';
    const entry = cache.get(cacheKey);
    
    if (!entry) return null;
    
    // Check if expired
    if (entry.expiresAt < Date.now()) {
      cache.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  } catch (err) {
    console.warn('Error retrieving cached feed:', err instanceof Error ? err.message : err);
    return null;
  }
};

export const preloadVideos = async (videoIds: number[]): Promise<void> => {
  try {
    cachedVideoIds = videoIds.slice(0, MAX_CACHED_VIDEOS);
    console.log(`✓ Preloaded ${videoIds.length} videos into memory cache`);
  } catch (err) {
    console.warn('Error preloading videos:', err instanceof Error ? err.message : err);
  }
};

export const clearCache = async (): Promise<void> => {
  try {
    cache.clear();
    cachedVideoIds = [];
    console.log('✓ Memory cache cleared');
  } catch (err) {
    console.warn('Error clearing cache:', err instanceof Error ? err.message : err);
  }
};

// Cleanup on process exit
process.on('exit', () => {
  clearInterval(cleanupInterval);
});
