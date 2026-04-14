import { Link } from "@tanstack/react-router";
import logo from "../../assets/bytestream-logo.png";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="ByteStream" width={36} height={36} />
          <span className="font-heading text-xl font-bold text-foreground">
            Byte<span className="text-primary">Stream</span>
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
          <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How It Works</a>
          <a href="#topics" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Topics</a>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
            Sign In
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}