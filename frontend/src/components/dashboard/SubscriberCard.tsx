import { Creator, formatCount } from "../../data/mockData";
import { MessageSquare } from "lucide-react";

interface SubscriberCardProps {
  creator: Creator;
  onToggle: () => void;
  onMessage?: () => void;
}

export function SubscriberCard({ creator, onToggle, onMessage }: SubscriberCardProps) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:shadow-soft transition-all">
      <img src={creator.avatar} alt={creator.name} className="size-12 rounded-full ring-2 ring-background shadow-sm" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-foreground truncate">{creator.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {creator.handle} · {formatCount(creator.subscribers)} subs
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onMessage}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Message"
        >
          <MessageSquare className="size-4" />
        </button>
        <button
          onClick={onToggle}
          className={`inline-flex items-center h-8 px-3 rounded-md text-xs font-medium transition-colors ${
            creator.isSubscribed
              ? "border border-border text-foreground hover:border-primary/40"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {creator.isSubscribed ? "Subscribed" : "Subscribe"}
        </button>
      </div>
    </div>
  );
}
