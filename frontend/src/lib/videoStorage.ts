export interface WatchedVideo {
  id: number
  videoTitle: string
  creator: string
  watchedAt: string
}

const WATCHED_HISTORY_KEY = 'bytestream_watched_history'
const WATCH_LATER_KEY = 'bytestream_watch_later'

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore write failures
  }
}

export function getWatchedHistory(): WatchedVideo[] {
  return readJson<WatchedVideo[]>(WATCHED_HISTORY_KEY, [])
}

export function addWatchedVideo(video: WatchedVideo) {
  const current = getWatchedHistory()
  const filtered = current.filter((item) => item.id !== video.id)
  const next = [video, ...filtered].slice(0, 20)
  writeJson(WATCHED_HISTORY_KEY, next)
  return next
}

export function getWatchLater(): number[] {
  return readJson<number[]>(WATCH_LATER_KEY, [])
}

export function isWatchLater(videoId: number) {
  return getWatchLater().includes(videoId)
}

export function toggleWatchLater(videoId: number) {
  const current = getWatchLater()
  const exists = current.includes(videoId)
  const next = exists ? current.filter((id) => id !== videoId) : [...current, videoId]
  writeJson(WATCH_LATER_KEY, next)
  return next
}
