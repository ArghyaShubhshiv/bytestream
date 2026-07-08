import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Bell, Compass, Library, Upload, LayoutDashboard } from "lucide-react";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center gap-4 h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="font-heading text-xl font-bold text-foreground">
              Byte<span className="text-primary">Stream</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {[
              { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
              { icon: Compass, label: "Explore", to: "/feed" },
              { icon: Library, label: "Library", to: "/submissions" },
              { icon: Upload, label: "Upload", to: "/create" },
            ].map((n) => {
              const isActive = pathname === n.to;
              return (
                <Link
                  key={n.label}
                  to={n.to}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <n.icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search videos, creators…"
                className="h-9 w-64 pl-9 pr-3 rounded-full bg-secondary border border-border focus:border-ring focus:bg-card outline-none text-sm transition-all"
              />
            </div>
            <button className="size-9 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Notifications">
              <Bell className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container py-6 sm:py-10 space-y-10 animate-fade-in">{children}</main>

      <footer className="border-t border-border mt-16">
        <div className="container py-6 text-xs text-muted-foreground flex items-center justify-between">
          <span>© 2026 Bytestream</span>
          <span>Crafted with care.</span>
        </div>
      </footer>
    </div>
  );
}