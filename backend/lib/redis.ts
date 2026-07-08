// Real Redis cache layer (ioredis).
//
// Design note: the cache is a *performance optimization*, not a correctness
// dependency. If Redis is unreachable we log once and fail open — every getter
// returns null (cache miss → falls through to Postgres) and every setter no-ops.
// The API server stays up either way. This mirrors the previous in-memory
// module's "never throw" contract, but now backed by a real, shared, persistent
// store instead of a per-process Map.

import "dotenv/config";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const MAX_CACHED_VIDEOS = 5;
const CACHE_TTL_SECONDS = 300; // 5 minutes — Redis handles expiry natively via EX

// Key layout:
//   video:<id>        -> JSON blob of a single video (TTL)
//   feed:latest       -> JSON blob of the feed (TTL)
//   cache:videoIds    -> list of recently cached video ids (recency, capped at 5)
const videoKey = (id: number) => `video:${id}`;
const FEED_KEY = "feed:latest";
const RECENT_LIST = "cache:videoIds";

let client: Redis | null = null;
let ready = false;

export const initializeRedis = async (): Promise<void> => {
  try {
    client = new Redis(REDIS_URL, {
      // Don't let a slow/absent Redis wedge the whole app on boot.
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 2000)),
    });

    client.on("error", (err) => {
      if (ready) {
        // Only warn after we were connected, to avoid log spam during reconnects.
        console.warn("Redis error:", err instanceof Error ? err.message : err);
      }
    });

    await client.connect();
    ready = true;
    console.log("✓ Redis connected");
  } catch (err) {
    ready = false;
    console.warn(
      "⚠ Redis unavailable — running without cache (fail-open):",
      err instanceof Error ? err.message : err,
    );
  }
};

export const getRedisClient = (): Redis | null => client;

export const cacheVideo = async (videoId: number, videoData: unknown): Promise<void> => {
  if (!ready || !client) return;
  try {
    await client.set(videoKey(videoId), JSON.stringify(videoData), "EX", CACHE_TTL_SECONDS);

    // Maintain a recency list capped at MAX_CACHED_VIDEOS; evict overflow keys.
    await client.lrem(RECENT_LIST, 0, String(videoId)); // de-dupe
    await client.lpush(RECENT_LIST, String(videoId));
    const overflow = await client.lrange(RECENT_LIST, MAX_CACHED_VIDEOS, -1);
    if (overflow.length > 0) {
      await client.ltrim(RECENT_LIST, 0, MAX_CACHED_VIDEOS - 1);
      await client.del(...overflow.map((id) => videoKey(Number(id))));
    }
  } catch (err) {
    console.warn("Error caching video:", err instanceof Error ? err.message : err);
  }
};

export const getCachedVideo = async (videoId: number): Promise<unknown | null> => {
  if (!ready || !client) return null;
  try {
    const raw = await client.get(videoKey(videoId));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Error retrieving cached video:", err instanceof Error ? err.message : err);
    return null;
  }
};

export const cacheFeed = async (feedData: unknown): Promise<void> => {
  if (!ready || !client) return;
  try {
    await client.set(FEED_KEY, JSON.stringify(feedData), "EX", CACHE_TTL_SECONDS);
  } catch (err) {
    console.warn("Error caching feed:", err instanceof Error ? err.message : err);
  }
};

export const getCachedFeed = async (): Promise<unknown | null> => {
  if (!ready || !client) return null;
  try {
    const raw = await client.get(FEED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Error retrieving cached feed:", err instanceof Error ? err.message : err);
    return null;
  }
};

// Invalidate the cached feed so a freshly uploaded/deleted video shows up
// immediately instead of waiting for the TTL to expire.
export const clearFeedCache = async (): Promise<void> => {
  if (!ready || !client) return;
  try {
    await client.del(FEED_KEY);
  } catch (err) {
    console.warn("Error clearing feed cache:", err instanceof Error ? err.message : err);
  }
};

export const preloadVideos = async (videoIds: number[]): Promise<void> => {
  if (!ready || !client) return;
  try {
    const ids = videoIds.slice(0, MAX_CACHED_VIDEOS).map(String);
    if (ids.length === 0) return;
    await client.del(RECENT_LIST);
    await client.rpush(RECENT_LIST, ...ids);
    console.log(`✓ Preloaded ${ids.length} videos into Redis recency list`);
  } catch (err) {
    console.warn("Error preloading videos:", err instanceof Error ? err.message : err);
  }
};

export const clearCache = async (): Promise<void> => {
  if (!ready || !client) return;
  try {
    // Only clear this app's keys, not the whole DB.
    const keys = await client.keys("video:*");
    const pipeline = client.pipeline();
    if (keys.length > 0) pipeline.del(...keys);
    pipeline.del(FEED_KEY);
    pipeline.del(RECENT_LIST);
    await pipeline.exec();
    console.log("✓ Redis cache cleared");
  } catch (err) {
    console.warn("Error clearing cache:", err instanceof Error ? err.message : err);
  }
};

// Graceful shutdown.
process.on("SIGINT", async () => {
  if (client) await client.quit().catch(() => {});
  process.exit(0);
});
process.on("SIGTERM", async () => {
  if (client) await client.quit().catch(() => {});
  process.exit(0);
});