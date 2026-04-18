import { Link } from '@tanstack/react-router'
import { useAuth } from '../../App'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-heading text-xl font-bold text-foreground">
            Byte<span className="text-primary">Stream</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            How It Works
          </a>
          <a href="#topics" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Topics
          </a>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">@{user.username}</span>
              <Link
                to="/feed"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Open Feed
              </Link>
              <button
                onClick={logout}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Sign In
              </Link>
              <Link
                to="/feed"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
