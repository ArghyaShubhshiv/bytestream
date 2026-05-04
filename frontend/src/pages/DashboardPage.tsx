import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Bookmark, Upload, Sparkles } from "lucide-react";
import {
  Activity,
  Creator,
  Profile,
  Video,
  mockActivity,
  mockLiked,
  mockProfile,
  mockRecommended,
  mockSaved,
  mockSubscribers,
  mockUploads,
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

const normalizeVideo = (video: Video): Video => ({
  ...video,
  thumbnail: video.thumbnail || videoPreview,
  creatorAvatar: video.creatorAvatar || logo,
});

export default function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({
    ...mockProfile,
    avatar: mockProfile.avatar || logo,
  });
  const [likedVideos, setLikedVideos] = useState<Video[]>(
    mockLiked.map(normalizeVideo),
  );
  const [savedVideos, setSavedVideos] = useState<Video[]>(
    mockSaved.map(normalizeVideo),
  );
  const [uploads, setUploads] = useState<Video[]>(
    mockUploads.map(normalizeVideo),
  );
  const [subscriptions, setSubscriptions] = useState<Creator[]>(mockSubscribers);
  const [activity] = useState<Activity[]>(mockActivity);
  const [recommendations, setRecommendations] = useState<Video[]>(
    mockRecommended.map(normalizeVideo),
  );

  const likedIds = useMemo(
    () => new Set(likedVideos.map((video) => video.id)),
    [likedVideos],
  );

  const handleToggleLike = (videoId: string) => {
    setRecommendations((current) =>
      current.map((video) =>
        video.id === videoId
          ? { ...video, isLiked: !video.isLiked }
          : video,
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
    setProfile((current) => ({
      ...current,
      stats: {
        ...current.stats,
        saved: Math.max(0, current.stats.saved - 1),
      },
    }));
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
    setProfile((current) => ({
      ...current,
      stats: {
        ...current.stats,
        uploads: Math.max(0, current.stats.uploads - 1),
      },
    }));
  };

  const handleEditUpload = (videoId: string) => {
    void videoId;
    navigate({ to: "/create" });
  };

  return (
    <DashboardLayout>
      {profile ? (
        <div className="space-y-10">
          <ProfileOverview profile={profile} />

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
      ) : (
        <div className="glass-card rounded-2xl border border-border bg-secondary/40 p-6 text-sm text-destructive">
          Unable to load your dashboard right now. Please try again.
        </div>
      )}
    </DashboardLayout>
  );
}
