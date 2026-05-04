import HeroSection from '../components/landing/HeroSection'
import TopicsSection from '../components/landing/TopicsSection'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../auth'

export default function LandingPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="font-heading text-xl font-bold">
            Byte<span className="text-primary">Stream</span>
          </span>
          <nav className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/feed"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Go to Feed
                </Link>
                <button
                  onClick={logout}
                  className="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <HeroSection />
        <TopicsSection />

        {/* Footer CTA */}
        <section className="py-24 text-center px-6">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Ready to start coding?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Watch short tutorials and solve the attached problem right in your browser — no setup needed.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to={user ? '/feed' : '/auth'}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {user ? 'Open feed' : 'Sign up free'}
            </Link>
            <Link
              to="/feed"
              className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors"
            >
              Browse videos
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ByteStream. Built for learners.
      </footer>
    </div>
  )
}
