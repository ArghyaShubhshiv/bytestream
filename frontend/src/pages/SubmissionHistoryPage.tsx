import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../App'
import { api } from '../../lib/api'

interface HistoryItem {
  id: number
  status: string
  language: string
  passedCount: number
  totalCount: number
  executionTimeMs: number | null
  createdAt: string
}

export default function SubmissionHistoryPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/submissions')
        setHistory(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        setError('Unable to load submission history. Backend may not be ready yet.')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [user])

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Submission History</h1>
            <p className="text-sm text-muted-foreground">
              Track your code runs and challenge submissions.
            </p>
          </div>
          <Link
            to="/feed"
            className="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
          >
            Back to feed
          </Link>
        </div>

        {!user ? (
          <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-6 text-center">
            <p className="text-muted-foreground mb-4">You need to sign in to view your submissions.</p>
            <Link
              to="/auth"
              className="inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <div className="glass-card rounded-3xl border border-border bg-secondary/40 p-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading your submissions…</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet. Run code from a video to create history.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border bg-background/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.language}</p>
                        <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        <span className="mr-3">{item.passedCount}/{item.totalCount}</span>
                        <span className="text-muted-foreground">cases</span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <span className="font-medium text-foreground">{item.status}</span>
                      {item.executionTimeMs != null && (
                        <span className="text-muted-foreground">{item.executionTimeMs} ms</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
