import { Activity } from "../../data/mockData";
import { Heart, MessageCircle, Upload, UserPlus, Bookmark } from "lucide-react";

const iconMap = {
  liked: Heart,
  commented: MessageCircle,
  uploaded: Upload,
  subscribed: UserPlus,
  saved: Bookmark,
} as const;

const toneMap = {
  liked: "text-rose-500 bg-rose-500/10",
  commented: "text-sky-500 bg-sky-500/10",
  uploaded: "text-primary bg-primary/10",
  subscribed: "text-violet-500 bg-violet-500/10",
  saved: "text-amber-500 bg-amber-500/10",
} as const;

export function ActivityFeed({ items }: { items: Activity[] }) {
  return (
    <ol className="relative space-y-1">
      <span className="absolute left-[19px] top-2 bottom-2 w-px bg-border" aria-hidden />
      {items.map((a) => {
        const Icon = iconMap[a.type];
        return (
          <li key={a.id} className="relative flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/40 transition-colors">
            <span className={`relative z-10 size-10 rounded-full flex items-center justify-center ${toneMap[a.type]}`}>
              <Icon className="size-4" />
            </span>
            <div className="flex-1 min-w-0 pt-1.5">
              <p className="text-sm text-foreground leading-snug">
                <span className="text-muted-foreground">{a.text}</span>{" "}
                <span className="font-medium">{a.target}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.timeAgo}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}