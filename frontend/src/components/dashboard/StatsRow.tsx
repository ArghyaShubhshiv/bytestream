import { Heart, Bookmark, Users, Upload } from "lucide-react";
import { formatCount, Profile } from "../../data/mockData";

interface StatsRowProps {
  stats: Profile["stats"];
}

const items = [
  { key: "likes", label: "Total likes", icon: Heart },
  { key: "saved", label: "Saved videos", icon: Bookmark },
  { key: "subscribers", label: "Subscribers", icon: Users },
  { key: "uploads", label: "Uploads", icon: Upload },
] as const;

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="relative p-4 rounded-xl bg-card border border-border overflow-hidden group hover:shadow-soft transition-shadow"
        >
          <div className="absolute -right-4 -top-4 size-20 rounded-full bg-gradient-primary opacity-[0.06] group-hover:opacity-10 transition-opacity" />
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Icon className="size-3.5" />
            {label}
          </div>
          <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground">
            {formatCount(stats[key])}
          </p>
        </div>
      ))}
    </div>
  );
}
