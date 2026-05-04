import { Play, Code2, Zap } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../../auth'

export default function HeroSection() {
  const { user } = useAuth()

  return (
    <section className="relative min-h-screen overflow-hidden pt-24">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] animate-pulse-slow" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Learn to code with short, focused videos</span>
          </div>
        </div>

        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Watch. Code.{' '}
            <span className="text-gradient-ember">Master.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Short video tutorials paired with a live IDE — learn by watching and coding side by side.
            No context switching, no friction.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={user ? '/feed' : '/auth'}
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 glow-ember"
            >
              <Play className="h-4 w-4 transition-transform group-hover:scale-110" />
              {user ? 'Start Learning Free' : 'Sign in to get started'}
            </Link>
            <a
              href="#topics"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <Code2 className="h-4 w-4" />
              Explore Topics
            </a>
          </div>
        </div>

        {/* Split Screen Preview */}
        <div className="mt-16 grid gap-4 lg:grid-cols-2">
          <div className="glass-card group relative overflow-hidden rounded-2xl p-2">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg bg-background/80 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Video Tutorial
            </div>
            <img 
              src="/src/assets/video-preview.jpg" 
              alt="Video Tutorial Preview"
              className="h-80 w-full rounded-3xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>

          <div className="glass-card group relative overflow-hidden rounded-2xl p-2">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg bg-background/80 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <Code2 className="h-3 w-3 text-primary" />
              Live IDE
            </div>
            <img 
              src="/src/assets/ide-preview.jpg" 
              alt="IDE Workspace Preview"
              className="h-80 w-full rounded-3xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
