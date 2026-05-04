import { Heart, Bookmark, Pencil, Trash2, Play } from "lucide-react";
import { Video, formatCount } from "../../data/mockData";

interface VideoCardProps {
  video: Video;
  variant?: "default" | "saved" | "upload";
  liked?: boolean;
  onToggleLike?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function VideoCard({
  video, variant = "default", liked, onToggleLike, onRemove, onEdit, onDelete,
}: VideoCardProps) {
  return (
    <article className="group relative rounded-xl bg-card border border-border overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5">
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <button
          aria-label={`Play ${video.title}`}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className="size-12 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shadow-glow">
            <Play className="size-5 fill-current" />
          </span>
        </button>
        {video.duration && (
          <span className="absolute bottom-2 right-2 text-xs font-medium px-1.5 py-0.5 rounded bg-foreground/80 text-background">
            {video.duration}
          </span>
        )}
        {video.status === "draft" && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30">
            Draft
          </span>
        )}
      </div>

      <div className="p-3.5">
        <h3 className="font-medium text-sm leading-snug text-foreground line-clamp-2 min-h-[2.5rem]">
          {video.title}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <img src={video.creatorAvatar} alt="" className="size-6 rounded-full" />
          <span className="text-xs text-muted-foreground truncate">{video.creator}</span>
        </div>

        {variant === "upload" && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatCount(video.views ?? 0)} views</span>
            <span>{formatCount(video.likes ?? 0)} likes</span>
            <span>{formatCount(video.comments ?? 0)} comments</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          {variant === "default" && (
            <button
              onClick={onToggleLike}
              aria-pressed={liked}
              aria-label={liked ? "Unlike" : "Like"}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border transition-all ${
                liked
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} />
              {liked ? "Liked" : "Like"}
            </button>
          )}
          {variant === "saved" && (
            <button
              onClick={onRemove}
              className="inline-flex items-center h-8 px-2.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Bookmark className="size-3.5 mr-1.5 fill-current" />
              Remove
            </button>
          )}
          {variant === "upload" && (
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="inline-flex items-center h-8 px-2.5 text-xs font-medium rounded-md border border-border hover:border-primary/40 hover:text-foreground transition-colors"
              >
                <Pencil className="size-3.5 mr-1.5" /> Edit
              </button>
              <button
                onClick={onDelete}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
