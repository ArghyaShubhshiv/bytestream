import { useEffect, useMemo, useState } from 'react'
import { Braces, Database, Globe, Cpu, GitBranch, Terminal, Search } from 'lucide-react'
import { api } from '../../lib/api'

interface Video {
  id: number
  videoTitle: string
  codePane: {
    problemTitle: string
    problemDescription: string
  }
}

const TOPIC_DEFINITIONS = [
  {
    name: 'Data Structures',
    icon: Braces,
    keywords: ['array', 'list', 'stack', 'queue', 'tree', 'graph', 'heap', 'hash'],
  },
  {
    name: 'Algorithms',
    icon: GitBranch,
    keywords: ['sort', 'search', 'dynamic programming', 'greedy', 'recursion', 'divide and conquer'],
  },
  {
    name: 'Web Development',
    icon: Globe,
    keywords: ['frontend', 'backend', 'react', 'vue', 'html', 'css', 'javascript', 'api'],
  },
  {
    name: 'Databases',
    icon: Database,
    keywords: ['sql', 'database', 'postgres', 'mongodb', 'query', 'table', 'schema'],
  },
  {
    name: 'System Design',
    icon: Cpu,
    keywords: ['architecture', 'scalability', 'microservices', 'design', 'load balancer', 'caching', 'high availability'],
  },
  {
    name: 'DevOps & CLI',
    icon: Terminal,
    keywords: ['docker', 'ci/cd', 'terminal', 'commands', 'linux', 'deployment', 'pipeline'],
  },
]

const getTopicCount = (videos: Video[]) => {
  const counts = TOPIC_DEFINITIONS.reduce<Record<string, number>>((acc, topic) => {
    acc[topic.name] = 0
    return acc
  }, {})

  const textForVideo = (video: Video) =>
    `${video.videoTitle} ${video.codePane.problemTitle} ${video.codePane.problemDescription}`.toLowerCase()

  videos.forEach((video) => {
    const text = textForVideo(video)
    TOPIC_DEFINITIONS.forEach((topic) => {
      if (topic.keywords.some((keyword) => text.includes(keyword))) {
        counts[topic.name] += 1
      }
    })
  })

  return counts
}

export default function TopicsSection() {
  const [videos, setVideos] = useState<Video[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/videos/feed')
        setVideos(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        setError('Unable to load topics from the feed right now. Refresh or try again later.')
        setVideos([])
      } finally {
        setLoading(false)
      }
    }

    loadFeed()
  }, [])

  const topicCounts = useMemo(() => getTopicCount(videos), [videos])

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return TOPIC_DEFINITIONS

    return TOPIC_DEFINITIONS.filter((topic) =>
      topic.name.toLowerCase().includes(query) ||
      topic.keywords.some((keyword) => keyword.includes(query)),
    )
  }, [search])

  const matchingVideos = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []

    return videos.filter((video) => {
      const text = `${video.videoTitle} ${video.codePane.problemTitle} ${video.codePane.problemDescription}`.toLowerCase()
      return text.includes(query)
    })
  }, [search, videos])

  return (
    <section id="topics" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Explore <span className="text-gradient-ember">topics</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Discover real tutorials from uploaded videos and find content that matches your interests.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Topics are automatically generated from video titles and problem descriptions.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              If no videos exist yet, the counts will update once creators upload content.
            </p>
          </div>
          <div className="relative max-w-md w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topic, keyword, or language"
              className="w-full rounded-3xl border border-border bg-secondary/30 pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-8 text-center text-muted-foreground">
              Loading topics from the feed...
            </div>
          ) : error ? (
            <div className="glass-card rounded-3xl border border-destructive/50 bg-destructive/10 p-8 text-center text-destructive">
              {error}
            </div>
          ) : filteredTopics.length > 0 ? (
            filteredTopics.map((topic) => {
              const count = topicCounts[topic.name] ?? 0
              const Icon = topic.icon

              return (
                <button
                  key={topic.name}
                  className="glass-card group flex flex-col gap-4 rounded-3xl border border-border p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="rounded-full bg-[#111] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      {count} videos
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{topic.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {count > 0
                        ? `See ${count} tutorials matching ${topic.name}.`
                        : `No tutorials for ${topic.name} yet. Add a video to grow this topic.`}
                    </p>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-8 text-center">
              <p className="text-lg font-semibold text-foreground mb-2">No matching topics found</p>
              <p className="text-sm text-muted-foreground">
                We didn’t find any videos matching your search. Try a broader keyword, or come back after creators upload more tutorials.
              </p>
            </div>
          )}
        </div>

        {search.trim() && !loading && !error && (
          <div className="mt-10 rounded-3xl border border-border bg-secondary/40 p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Search results for <span className="text-foreground font-semibold">"{search}"</span>
            </p>
            {matchingVideos.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {matchingVideos.slice(0, 4).map((video) => (
                  <div key={video.id} className="rounded-3xl border border-border bg-background/80 p-4 hover:border-primary transition-colors">
                    <h4 className="text-base font-semibold text-foreground">{video.videoTitle}</h4>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {video.codePane.problemDescription}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-background/80 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No videos currently match your search. Try keywords like <span className="text-foreground">arrays</span>, <span className="text-foreground">React</span>, or <span className="text-foreground">SQL</span>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
