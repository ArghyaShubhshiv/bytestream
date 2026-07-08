import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Bookmark, Upload, Sparkles } from "lucide-react";
import { useAuth } from "../App";
import { api } from "../../lib/api";
import {
  Activity,
  Creator,
  Profile,
  Video,
} from "../data/mockData";
import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { ProfileOverview } from "../components/dashboard/ProfileOverview";
import { SectionHeader } from "../components/dashboard/SectionHeader";
import { VideoCard } from "../components/dashboard/VideoCard";
import { VideoCardSkeleton } from "../components/dashboard/Skeleton";
import { EmptyState } from "../components/dashboard/EmptyState";
import { SubscriberCard } from "../components/dashboard/SubscriberCard";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import videoPreview from "../assets/video-preview.jpg";
import logo from "../assets/bytestream-logo.png";

// ─── Shape returned by GET /api/users/me/dashboard ──────────────────────────
interface ApiVideo {
  id: number;
  title: string;
  creator: string;
  creatorAvatar: string;
  thumbnail: string;
  duration: string | null;
  views?: number;
  likes?: number;
  comments?: number;
  status?: "published" | "draft";
  isLiked?: boolean;
}

interface ApiCreator {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  subscribers: number;
  isSubscribed: boolean;
}

interface DashboardResponse {
  profile: {
    username: string;
    handle: string;
    role: Profile["role"];
    bio: string;
    avatar: string;
    stats: Profile["stats"];
  };
  likedVideos: ApiVideo[];
  savedVideos: ApiVideo[];
  uploads: ApiVideo[];
  subscriptions: ApiCreator[];
  activity: Activity[];
  recommendations: ApiVideo[];
}

const mapVideo = (video: ApiVideo): Video & { isLiked?: boolean } => ({
  id: String(video.id),
  title: video.title,
  creator: video.creator,
  creatorAvatar: video.creatorAvatar || logo,
  thumbnail: video.thumbnail || videoPreview,
  duration: video.duration || "",
  views: video.views ?? 0,
  likes: video.likes ?? 0,
  comments: video.comments ?? 0,
  status: video.status ?? "published",
  isLiked: video.isLiked,
});

const mapCreator = (creator: ApiCreator): Creator => ({
  id: String(creator.id),
  name: creator.name,
  handle: creator.handle,
  avatar: creator.avatar || logo,
  subscribers: creator.subscribers,
  isSubscribed: creator.isSubscribed,
});

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [likedVideos, setLikedVideos] = useState<Video[]>([]);
  const [savedVideos, setSavedVideos] = useState<Video[]>([]);
  const [uploads, setUploads] = useState<Video[]>([]);
  const [subscriptions, setSubscriptions] = useState<Creator[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [recommendations, setRecommendations] = useState<
    (Video & { isLiked?: boolean })[]
  >([]);

  useEffect(() => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }

    let cancelled = false;
    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get<DashboardResponse>("/users/me/dashboard");
        if (cancelled) return;
        const data = res.data;
        setProfile({
          username: data.profile.username,
          handle: data.profile.handle,
          role: data.profile.role,
          bio: data.profile.bio,
          avatar: data.profile.avatar || logo,
          stats: data.profile.stats,
        });
        setLikedVideos(data.likedVideos.map(mapVideo));
        setSavedVideos(data.savedVideos.map(mapVideo));
        setUploads(data.uploads.map(mapVideo));
        setSubscriptions(data.subscriptions.map(mapCreator));
        setActivity(data.activity);
        setRecommendations(data.recommendations.map(mapVideo));
      } catch {
        if (!cancelled) setError("Unable to load your dashboard right now. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [navigate, user]);

  const likedIds = useMemo(
    () => new Set(likedVideos.map((video) => video.id)),
    [likedVideos],
  );

  const handleToggleLike = (videoId: string) => {
    setRecommendations((current) =>
      current.map((video) =>
        video.id === videoId ? { ...video, isLiked: !video.isLiked } : video,
      ),
    );
    setLikedVideos((current) => {
      const exists = current.some((video) => video.id === videoId);
      if (exists) return current.filter((video) => video.id !== videoId);
      const fromRecommendations = recommendations.find((video) => video.id === videoId);
      return fromRecommendations
        ? [{ ...fromRecommendations, isLiked: true }, ...current]
        : current;
    });
  };

  const handleRemoveSaved = (videoId: string) => {
    setSavedVideos((current) => current.filter((video) => video.id !== videoId));
  };

  const handleToggleSubscription = (creatorId: string) => {
    setSubscriptions((current) =>
      current.map((creator) =>
        creator.id === creatorId
          ? { ...creator, isSubscribed: !creator.isSubscribed }
          : creator,
      ),
    );
  };

  const handleDeleteUpload = (videoId: string) => {
    setUploads((current) => current.filter((video) => video.id !== videoId));
  };

  const handleEditUpload = (videoId: string) => {
    void videoId;
    navigate({ to: "/create" });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="glass-card rounded-2xl border border-border bg-secondary/40 p-6 text-sm text-destructive">
          {error || "Unable to load your dashboard right now. Please try again."}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <ProfileOverview
          name={profile.username}
          handle={profile.handle}
          stats={profile.stats}
        />

        <section>
          <SectionHeader
            title="Liked videos"
            subtitle="Everything you've shown some love."
            action={<Link to="/feed" className="text-sm text-primary">View all</Link>}
          />
          {likedVideos.length === 0 ? (
            <EmptyState
              icon={<Heart className="size-5" />}
              title="No liked videos yet"
              description="Like tutorials from the feed to build your collection."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {likedVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  liked={likedIds.has(video.id)}
                  onToggleLike={() => handleToggleLike(video.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader
            title="Watch later"
            subtitle="Saved sessions waiting for a quiet moment."
          />
          {savedVideos.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="size-5" />}
              title="Nothing saved"
              description="Save videos from the feed so you can return later."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  variant="saved"
                  onRemove={() => handleRemoveSaved(video.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader
            title="Your uploads"
            subtitle="Manage drafts and published videos."
            action={<Link to="/create" className="text-sm text-primary">Studio {"->"}</Link>}
          />
          {uploads.length === 0 ? (
            <EmptyState
              icon={<Upload className="size-5" />}
              title="No uploads yet"
              description="Upload your first tutorial to start teaching."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uploads.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  variant="upload"
                  onEdit={() => handleEditUpload(video.id)}
                  onDelete={() => handleDeleteUpload(video.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl border border-border bg-card p-5">
            <SectionHeader
              title="Recent activity"
              subtitle="A timeline of what you've been up to."
            />
            {activity.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="size-5" />}
                title="No activity yet"
                description="Interact with content to see your latest actions here."
              />
            ) : (
              <ActivityFeed items={activity} />
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <SectionHeader
              title="Subscriptions"
              subtitle="Creators you follow."
            />
            {subscriptions.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="size-5" />}
                title="Not following anyone"
                description="Subscribe to creators to keep up with their tutorials."
              />
            ) : (
              <div className="space-y-3">
                {subscriptions.map((creator) => (
                  <SubscriberCard
                    key={creator.id}
                    creator={creator}
                    onToggle={() => handleToggleSubscription(creator.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <SectionHeader
            title="Recommended for you"
            subtitle="Picked based on your recent activity."
            action={<span className="text-xs text-muted-foreground">Personalized</span>}
          />
          {recommendations.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="size-5" />}
              title="No recommendations"
              description="Watch a few tutorials so we can tailor suggestions."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  liked={video.isLiked}
                  onToggleLike={() => handleToggleLike(video.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
