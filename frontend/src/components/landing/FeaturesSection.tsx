import { MonitorPlay, Code2, Layers, Rocket, BookOpen, Users } from 'lucide-react'

const features = [
  {
    icon: MonitorPlay,
    title: 'Short Video Lessons',
    description: 'Bite-sized video tutorials focused on one concept at a time. No 3-hour lectures.',
  },
  {
    icon: Code2,
    title: 'Integrated IDE',
    description: 'Code alongside the video in a built-in editor. Practice as you learn, instantly.',
  },
  {
    icon: Layers,
    title: 'Topic-Based Learning',
    description: 'Structured paths covering DSA, web dev, system design, and more.',
  },
  {
    icon: Rocket,
    title: 'Instant Feedback',
    description: 'Run your code and see results immediately. No setup required.',
  },
  {
    icon: BookOpen,
    title: 'Code Pane Reference',
    description: 'View the tutorial\'s source code side by side. Copy, modify, and experiment.',
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Contribute topics, share solutions, and learn alongside fellow developers.',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Everything you need to{' '}
            <span className="text-gradient-ember">level up</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            ByteStream combines the best of video learning and hands-on coding into one seamless experience.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card group rounded-2xl p-6 transition-all duration-300 hover:border-primary/30"
            >
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
