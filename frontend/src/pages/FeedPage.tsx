import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Search, Clock3, ThumbsUp, ThumbsDown, Bookmark, Sparkles } from 'lucide-react'
import { useAuth } from '../App'
import { api } from '../../lib/api'
import VideoDisplay, { type Video } from '../components/VideoDisplay'
import CodePane from '../components/CodePane'
import { addWatchedVideo, getWatchedHistory, getWatchLater, toggleWatchLater, WatchedVideo } from '../lib/videoStorage'

interface Comment {
  id: number
  text: string
  createdAt: string
  user: { username: string }
  _count?: {
    commentLikes: number
    commentDislikes: number
  }
  likedByUser?: boolean
  dislikedByUser?: boolean
}

export default function FeedPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [videos, setVideos] = useState<Video[]>([])
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [watchLaterIds, setWatchLaterIds] = useState<number[]>(getWatchLater())
  const [history, setHistory] = useState<WatchedVideo[]>(getWatchedHistory())
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [interactionError, setInteractionError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate({ to: '/auth' })
      return
    }

    const loadFeed = async (query?: string) => {
      setLoading(true)
      setError('')
      try {
        const endpoint = query?.trim() ? '/videos/search' : '/videos/feed'
        const res = await api.get(endpoint, {
          params: query?.trim() ? { query: query.trim() } : undefined,
        })
        const feedVideos = Array.isArray(res.data) ? res.data : []
        setVideos(feedVideos)
        if (feedVideos.length > 0 && !feedVideos.some((video) => video.id === activeVideo?.id)) {
          setActiveVideo(feedVideos[0])
        }
      } catch (err) {
        setError('Unable to load the video feed. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadFeed(search)
  }, [navigate, search, user])

  useEffect(() => {
    if (!activeVideo) return
    addWatchedVideo({
      id: activeVideo.id,
      videoTitle: activeVideo.videoTitle,
      creator: activeVideo.creator.username,
      watchedAt: new Date().toISOString(),
    })
    setHistory(getWatchedHistory())
    if (user) {
      fetchWatchLater()
    } else {
      setWatchLaterIds(getWatchLater())
    }
    fetchComments(activeVideo.id)
  }, [activeVideo, user])

  const activeIsWatchLater = activeVideo ? watchLaterIds.includes(activeVideo.id) : false

  const fetchComments = async (videoId: number) => {
    setCommentsLoading(true)
    try {
      const res = await api.get(`/interactions/videos/${videoId}`)
      setComments(Array.isArray(res.data) ? res.data : [])
    } catch {
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }

  const fetchWatchLater = async () => {
    if (!user) return
    try {
      const res = await api.get('/watchlater')
      setWatchLaterIds(Array.isArray(res.data) ? res.data : getWatchLater())
    } catch {
      setWatchLaterIds(getWatchLater())
    }
  }

  const handleVideoSelect = (video: Video) => {
    setActiveVideo(video)
    setInteractionError('')
    setLiked(false)
    setDisliked(false)
  }

  const toggleLike = async () => {
    if (!activeVideo) return
    if (!user) {
      setInteractionError('Sign in to like tutorials.')
      return
    }

    try {
      await api.post(`/interactions/videos/${activeVideo.id}/like`)
      setLiked((current) => !current)
      if (disliked) setDisliked(false)
      setInteractionError('')
    } catch {
      setInteractionError('Like failed. Please sign in or try again.')
    }
  }

  const toggleDislike = async () => {
    if (!activeVideo) return
    if (!user) {
      setInteractionError('Sign in to dislike tutorials.')
      return
    }

    try {
      await api.post(`/interactions/videos/${activeVideo.id}/dislike`)
      setDisliked((current) => !current)
      if (liked) setLiked(false)
      setInteractionError('')
    } catch {
      setInteractionError('Dislike failed. Please sign in or try again.')
    }
  }

  const handleToggleWatchLater = async () => {
    if (!activeVideo) return
    if (!user) {
      setWatchLaterIds(toggleWatchLater(activeVideo.id))
      return
    }

    try {
      const res = await api.post(`/watchlater/${activeVideo.id}`)
      setWatchLaterIds(Array.isArray(res.data) ? res.data : watchLaterIds)
    } catch {
      setInteractionError('Unable to save for later. Please try again.')
    }
  }

  const handleSubmitComment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!activeVideo || !commentText.trim()) return
    if (!user) {
      setInteractionError('Sign in to leave a comment.')
      return
    }

    try {
      await api.post(`/interactions/videos/${activeVideo.id}`, { text: commentText.trim() })
      setCommentText('')
      fetchComments(activeVideo.id)
    } catch {
      setInteractionError('Unable to post comment. Please sign in and try again.')
    }
  }

  const toggleCommentLike = async (commentId: number) => {
    if (!user) {
      setInteractionError('Sign in to like comments.')
      return
    }

    try {
      await api.post(`/comment/${commentId}/like`)
      if (activeVideo) fetchComments(activeVideo.id)
    } catch {
      setInteractionError('Unable to like comment.')
    }
  }

  const toggleCommentDislike = async (commentId: number) => {
    if (!user) {
      setInteractionError('Sign in to dislike comments.')
      return
    }

    try {
      await api.post(`/comment/${commentId}/dislike`)
      if (activeVideo) fetchComments(activeVideo.id)
    } catch {
      setInteractionError('Unable to dislike comment.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="glass-card rounded-3xl border border-border bg-secondary/50 p-10 text-center">
          <p className="text-lg font-semibold">Loading the feed...</p>
          <p className="mt-2 text-sm text-muted-foreground">Hang tight while we fetch the latest tutorials.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Your learning workspace</p>
            <h1 className="text-3xl font-heading font-bold">Interactive coding feed</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Create Video
            </Link>
            <Link
              to="/submissions"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <Clock3 className="h-4 w-4" />
              My Submissions
            </Link>
          </div>
        </div>

        <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Find a video to code with</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Search through uploaded tutorials using titles, descriptions, or keywords.
              </p>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search videos, algorithms, or topics"
                className="w-full rounded-3xl border border-border bg-background/80 pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
          <aside className="space-y-6">
            <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Short tutorials</p>
                  <h2 className="text-xl font-semibold text-foreground">{videos.length} videos</h2>
                </div>
                <span className="rounded-full bg-background/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {activeVideo ? 'Now playing' : 'Select one'}
                </span>
              </div>
            </div>

            {error ? (
              <div className="glass-card rounded-3xl border border-red-500 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="glass-card rounded-3xl border border-border bg-secondary/30 p-5">
              <VideoDisplay
                videos={videos}
                selectedVideoId={activeVideo?.id ?? null}
                onVideoChange={handleVideoSelect}
              />
            </div>

            <div className="grid gap-4">
              <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-5">
                <p className="text-sm text-muted-foreground">Watch later</p>
                <p className="mt-3 text-foreground text-lg font-semibold">{watchLaterIds.length} saved</p>
                <p className="mt-2 text-xs text-muted-foreground">Saved tutorials are ready to revisit when you need them.</p>
              </div>
              <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-5">
                <p className="text-sm text-muted-foreground">Quick history</p>
                {history.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No watched videos yet — tap one to begin.</p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {history.slice(0, 4).map((item) => (
                      <div key={`${item.id}-${item.watchedAt}`} className="rounded-3xl bg-background/80 p-3">
                        <p className="text-sm font-semibold text-foreground">{item.videoTitle}</p>
                        <p className="mt-1 text-xs text-muted-foreground">@{item.creator}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="glass-card rounded-3xl border border-border bg-secondary/40 overflow-hidden">
              {activeVideo ? (
                <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] p-5">
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-border bg-black overflow-hidden shadow-inner">
                      {activeVideo.videoUrl ? (
                        <video
                          key={activeVideo.id}
                          controls
                          src={activeVideo.videoUrl}
                          className="w-full max-h-[360px] object-cover"
                        />
                      ) : (
                        <div className="h-[360px] flex items-center justify-center text-muted-foreground">
                          Video file unavailable
                        </div>
                      )}

                      <div className="bg-[#0b0b0b] p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Streaming now</p>
                            <h2 className="text-2xl font-semibold text-foreground">{activeVideo.videoTitle}</h2>
                            <p className="text-sm text-muted-foreground">@{activeVideo.creator.username}</p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={toggleLike}
                              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition-colors ${
                                liked ? 'bg-green-500/15 text-green-300' : 'bg-background/80 text-foreground hover:bg-secondary'
                              }`}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              {liked ? 'Liked' : 'Like'}
                            </button>
                            <button
                              onClick={toggleDislike}
                              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition-colors ${
                                disliked ? 'bg-red-500/15 text-red-300' : 'bg-background/80 text-foreground hover:bg-secondary'
                              }`}
                            >
                              <ThumbsDown className="h-4 w-4" />
                              {disliked ? 'Disliked' : 'Dislike'}
                            </button>
                            <button
                              onClick={handleToggleWatchLater}
                              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition-colors ${
                                activeIsWatchLater ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-foreground hover:bg-secondary'
                              }`}
                            >
                              <Bookmark className="h-4 w-4" />
                              {activeIsWatchLater ? 'Saved' : 'Save'}
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span>{comments.length} comments</span>
                          <span>{watchLaterIds.length} saved</span>
                        </div>
                        {interactionError ? (
                          <div className="mt-4 rounded-3xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {interactionError}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-border bg-background/80 p-5">
                      <p className="text-sm text-muted-foreground">Active problem</p>
                      <h3 className="mt-3 text-xl font-semibold text-foreground">{activeVideo.codePane.problemTitle}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{activeVideo.codePane.problemDescription}</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border bg-secondary/40 p-4">
                    <p className="text-sm text-muted-foreground">IDE panel</p>
                    <div className="mt-4 h-[620px] overflow-hidden rounded-3xl border border-border bg-[#111]">
                      <CodePane
                        problemTitle={activeVideo.codePane.problemTitle}
                        problemDescription={activeVideo.codePane.problemDescription}
                        videoId={activeVideo.id}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Select a video from the left to preview the video and IDE.
                </div>
              )}
            </div>

            {activeVideo && (
              <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-5">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Community discussion</p>
                    <h3 className="text-xl font-semibold text-foreground">Comments</h3>
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-primary">{comments.length} comments</span>
                </div>

                {commentsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading comments…</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet. Be first to react!</p>
                ) : (
                  <div className="space-y-4">
                    {comments.slice(0, 5).map((comment) => (
                      <div key={comment.id} className="rounded-3xl border border-border bg-background/80 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">@{comment.user.username}</p>
                          <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</p>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{comment.text}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                          <button
                            type="button"
                            onClick={() => toggleCommentLike(comment.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-2 text-xs text-foreground hover:bg-secondary"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {comment._count?.commentLikes ?? 0}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCommentDislike(comment.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-2 text-xs text-foreground hover:bg-secondary"
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                            {comment._count?.commentDislikes ?? 0}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSubmitComment} className="mt-5 space-y-3">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    placeholder={user ? 'Share your thoughts or ask a question…' : 'Sign in to add a comment.'}
                    disabled={!user}
                    className="w-full resize-none rounded-3xl border border-border bg-background/90 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={!user || commentText.trim().length === 0}
                    className="inline-flex items-center gap-2 rounded-3xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Post comment
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
