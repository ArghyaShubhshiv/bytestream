import { useEffect } from 'react'
import { api } from '../../lib/api'

interface CachedVideoFeed {
  data: unknown
  timestamp: number
  expiresAt: number
}

const CACHE_KEY = 'videofeed_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Preloads videos from the API on app startup and caches them
 * Videos are fetched eagerly so they're ready when needed
 */
export function usePreloadVideos() {
  useEffect(() => {
    const preloadVideos = async () => {
      try {
        // Check if we have fresh cached data
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsed: CachedVideoFeed = JSON.parse(cached)
          if (parsed.expiresAt > Date.now()) {
            // Cache is still fresh, no need to refetch
            return
          }
        }

        // Fetch videos in background (non-blocking)
        const response = await api.get('/videos/feed')
        
        // Cache the response
        const cacheData: CachedVideoFeed = {
          data: response.data,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_TTL,
        }
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
      } catch (err) {
        // Silently fail - app will fetch on demand if preload fails
        console.warn('Video preload failed (non-blocking):', err instanceof Error ? err.message : err)
      }
    }

    // Run preload without blocking
    preloadVideos()
  }, [])
}

/**
 * Get cached video feed if available
 */
export function getCachedVideoFeed(): unknown | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const parsed: CachedVideoFeed = JSON.parse(cached)
    
    // Check if cache is still fresh
    if (parsed.expiresAt < Date.now()) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }

    return parsed.data
  } catch (err) {
    console.warn('Error reading cached video feed:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Clear the cached video feed
 */
export function clearVideoFeedCache() {
  sessionStorage.removeItem(CACHE_KEY)
}
