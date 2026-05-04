import { useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useAuth } from '../auth'
import { api } from '../lib/api'
import { getWatchedHistory, type WatchedVideo } from '../lib/videoStorage'

interface User {
  id: number
  username: string
  email: string
  createdAt: string
}

interface ProfileVideo {
  id: number
  videoTitle: string
  videoUrl: string | null
  creator: { username: string }
  codePane: {
    problemTitle: string
    problemDescription: string
  }
  commentCount: number
}

interface RecentComment {
  id: number
  text: string
  createdAt: string
  video: { id: number; videoTitle: string }
}

export default function UserProfilePage() {
  const { user: authUser } = useAuth()
  const { username } = useParams({ from: '/profile/$username' })
  const [user, setUser] = useState<User | null>(null)
  const [videos, setVideos] = useState<ProfileVideo[]>([])
  const [recentComments, setRecentComments] = useState<RecentComment[]>([])
  const [watchHistory, setWatchHistory] = useState<WatchedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError('')
      setUser(null)
      setVideos([])
      setRecentComments([])

      try {
        const res = await api.get(`/users/${encodeURIComponent(username)}`)
        const data = res.data as {
          user: User
          videos: ProfileVideo[]
          recentComments?: RecentComment[]
        }

        setUser(data.user)
        setVideos(data.videos)
        setRecentComments(data.recentComments ?? [])
      } catch (err) {
        setError('Unable to load creator profile. Backend may not be ready yet.')
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchProfile()
    }
  }, [username])

  useEffect(() => {
    if (authUser?.username === username) {
      setWatchHistory(getWatchedHistory())
    }
  }, [authUser, username])

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/feed" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to feed
            </Link>
            <h1 className="mt-3 text-3xl font-heading font-bold">{username}</h1>
            <p className="text-sm text-muted-foreground">Creator profile</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
            {user ? `Joined ${new Date(user.createdAt).toLocaleDateString()}` : 'Profile preview'}
          </div>
        </div>

        <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-3xl bg-[#111] px-4 py-2 text-sm text-foreground">
                  @{user?.username}
                </div>
                <div className="rounded-3xl bg-secondary/50 px-4 py-2 text-sm text-muted-foreground">
                  {videos.length} video{videos.length === 1 ? '' : 's'}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This page is ready to show creator details when the backend exposes the profile data.
              </p>
            </div>
          )}
        </div>

        {user && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Tutorials from @{user.username}</h2>
            {videos.length === 0 ? (
              <div className="rounded-2xl border border-border bg-background/80 p-6 text-sm text-muted-foreground">
                No videos found for this creator yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {videos.map((video) => (
                  <a
                    key={video.id}
                    href={`/video/${video.id}`}
                    className="rounded-3xl border border-border bg-secondary/40 p-5 hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-base font-semibold text-foreground">{video.videoTitle}</h3>
                      <span className="rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                        {video.commentCount} comments
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">Watch the tutorial and solve the problem.</p>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {authUser?.username === username ? (
          <>
            <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Watch history</p>
                  <h2 className="text-xl font-semibold text-foreground">Your watched tutorials</h2>
                </div>
              </div>
              {watchHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Your watch history will show here once you play videos from the feed.</p>
              ) : (
                <div className="space-y-4">
                  {watchHistory.map((item) => (
                    <div key={`${item.id}-${item.watchedAt}`} className="rounded-3xl border border-border bg-background/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{item.videoTitle}</p>
                        <p className="text-xs text-muted-foreground">{new Date(item.watchedAt).toLocaleDateString()}</p>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">@{item.creator}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Creator feedback</p>
                  <h2 className="text-xl font-semibold text-foreground">Recent comments on your videos</h2>
                </div>
              </div>
              {recentComments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments on your videos yet. Share your tutorial to get feedback.</p>
              ) : (
                <div className="space-y-4">
                  {recentComments.slice(0, 5).map((comment) => (
                    <div key={comment.id} className="rounded-3xl border border-border bg-background/80 p-4">
                      <p className="text-sm font-semibold text-foreground">{comment.video.videoTitle}</p>
                      <p className="mt-3 text-sm text-muted-foreground">{comment.text}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : authUser ? (
          <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
            Watch history is only visible on your own profile when you are signed in.
          </div>
        ) : null}
      </div>
    </div>
  )
}
