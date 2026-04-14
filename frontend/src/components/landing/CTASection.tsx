import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-12 text-center glow-ember md:p-20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          <div className="relative">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              Ready to start coding<span className="text-primary">?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Join thousands of developers learning through short videos and hands-on coding.
            </p>
            <button className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
              Get Started for Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}