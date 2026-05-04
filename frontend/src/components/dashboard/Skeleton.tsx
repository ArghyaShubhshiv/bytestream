export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-muted rounded-md ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, hsl(var(--muted)) 0px, hsl(var(--accent)) 40%, hsl(var(--muted)) 80%)",
        backgroundSize: "1000px 100%",
        animation: "shimmer 2s linear infinite",
      }}
    />
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="rounded-xl bg-card border border-border p-3 space-y-3">
      <Skeleton className="aspect-video w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-2/5" />
    </div>
  );
}
