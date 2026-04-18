import { Braces, Database, Globe, Cpu, GitBranch, Terminal } from 'lucide-react'

const topics = [
  { icon: Braces, name: 'Data Structures', count: '42 videos' },
  { icon: GitBranch, name: 'Algorithms', count: '38 videos' },
  { icon: Globe, name: 'Web Development', count: '56 videos' },
  { icon: Database, name: 'Databases', count: '24 videos' },
  { icon: Cpu, name: 'System Design', count: '18 videos' },
  { icon: Terminal, name: 'DevOps & CLI', count: '30 videos' },
]

export default function TopicsSection() {
  return (
    <section id="topics" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Explore <span className="text-gradient-ember">topics</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dive into the subjects that matter most to your career.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <button
              key={topic.name}
              className="glass-card group flex items-center gap-4 rounded-2xl p-5 text-left transition-all duration-300 hover:border-primary/30"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <topic.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">{topic.name}</h3>
                <p className="text-sm text-muted-foreground">{topic.count}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
