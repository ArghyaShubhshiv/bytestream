const steps = [
  {
    number: '01',
    title: 'Pick a Topic',
    description: 'Browse through curated topics — from arrays and trees to React and APIs.',
  },
  {
    number: '02',
    title: 'Watch & Code',
    description: 'A short video plays on one side. The IDE opens on the other. Learn by doing.',
  },
  {
    number: '03',
    title: 'Master It',
    description: 'Run your code, experiment, and move on to the next concept when you\'re ready.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            How it <span className="text-gradient-ember">works</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Three simple steps to start your coding journey.</p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-12 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-primary/40 to-transparent md:block" />
              )}
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 font-heading text-2xl font-bold text-primary">
                {step.number}
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
