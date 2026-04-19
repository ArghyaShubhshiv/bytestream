import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { api } from '../../lib/api'
import CodePane from '../components/CodePane'

interface Video {
  id: number
  videoTitle: string
  videoUrl: string | null
  creator: { username: string }
  codePane: {
    problemTitle: string
    problemDescription: string
    testCases?: Array<{ input: string; expectedOutput: string }>
  }
}

export default function VideoDetailPage() {
  const rawSegment = window.location.pathname.split('/').pop() ?? ''
  const videoId = Number(rawSegment)
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true)
      setError('')
      setVideo(null)

      if (Number.isNaN(videoId)) {
        setError('Invalid video ID.')
        setLoading(false)
        return
      }

      try {
        const res = await api.get(`/videos/${videoId}`)
        setVideo(res.data)
      } catch (err) {
        try {
          const feedRes = await api.get('/videos/feed')
          const feedVideos = Array.isArray(feedRes.data) ? feedRes.data : []
          const foundVideo = feedVideos.find((item) => item.id === videoId)
          if (!foundVideo) {
            throw new Error('Video not found')
          }
          setVideo(foundVideo)
        } catch (fallbackError) {
          setError('Unable to load video details yet. Backend route /videos/:id may not be available.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchVideo()
  }, [videoId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-lg">Loading video details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="glass-card rounded-2xl border border-border bg-secondary/60 p-6">
          <h1 className="text-2xl font-heading font-bold mb-3">Video details unavailable</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link
            to="/feed"
            className="inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to feed
          </Link>
        </div>
      </div>
    )
  }

  if (!video) return null

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/feed" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to feed
            </Link>
            <h1 className="mt-3 text-3xl font-heading font-bold">{video.videoTitle}</h1>
            <p className="text-sm text-muted-foreground">By @{video.creator.username}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/profile/${video.creator.username}`}
              className="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
            >
              View Creator
            </a>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="glass-card rounded-3xl border border-border bg-secondary/40 overflow-hidden">
              {video.videoUrl ? (
                <video
                  controls
                  className="w-full bg-black"
                  src={video.videoUrl}
                />
              ) : (
                <div className="flex h-80 items-center justify-center bg-[#111] text-muted-foreground">
                  Video file not available yet
                </div>
              )}
            </div>

            <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-6">
              <h2 className="text-xl font-semibold text-foreground">Problem</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {video.codePane.problemDescription}
              </p>
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">Interactive Coding</h2>
            <CodePane
              problemTitle={video.codePane.problemTitle}
              problemDescription={video.codePane.problemDescription}
              videoId={video.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
