import { Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const getUserData = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, createdAt: true },
    });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  const rawUsername = req.params.username;
  const username = Array.isArray(rawUsername) ? rawUsername[0] : rawUsername;

  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, email: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const videos = await prisma.video.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { username: true } },
        codePane: true,
        _count: { select: { comments: true } },
      },
    });

    const mappedVideos = videos.map((video) => ({
      ...video,
      commentCount: video._count.comments,
    }));

    const recentComments = await prisma.comment.findMany({
      where: { video: { creatorId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        video: { select: { id: true, videoTitle: true } },
        user: { select: { username: true } },
      },
    });

    res.json({ user, videos: mappedVideos, recentComments });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

export const getUserDashboard = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.internalUserId!;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const [
      uploadsCount,
      subscribersCount,
      savedCount,
      totalLikesOnUploads,
      likedVideos,
      savedEntries,
      uploads,
      subscriptions,
      recentComments,
      recommendations,
    ] = await Promise.all([
      prisma.video.count({ where: { creatorId: userId } }),
      prisma.subscription.count({ where: { creatorId: userId } }),
      prisma.watchLater.count({ where: { userId } }),
      prisma.videoLikes.count({ where: { video: { creatorId: userId } } }),
      prisma.video.findMany({
        where: { videoLikes: { some: { userId } } },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          creator: { select: { username: true } },
          _count: { select: { videoLikes: true, comments: true } },
        },
      }),
      prisma.watchLater.findMany({
        where: { userId },
        orderBy: { addedAt: "desc" },
        take: 6,
        include: {
          video: {
            include: {
              creator: { select: { username: true } },
              _count: { select: { videoLikes: true, comments: true } },
            },
          },
        },
      }),
      prisma.video.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          creator: { select: { username: true } },
          _count: { select: { videoLikes: true, comments: true } },
        },
      }),
      prisma.subscription.findMany({
        where: { subscriberId: userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          creator: { select: { id: true, username: true } },
        },
      }),
      prisma.comment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { video: { select: { videoTitle: true } } },
      }),
      prisma.video.findMany({
        where: {
          creatorId: { not: userId },
          videoLikes: { none: { userId } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          creator: { select: { username: true } },
          _count: { select: { videoLikes: true, comments: true } },
        },
      }),
    ]);

    const uploadsRole = uploadsCount > 0 ? "creator" : "learner";

    const profile = {
      id: user.id,
      username: user.username,
      handle: `@${user.username}`,
      role: uploadsRole,
      bio: uploadsRole === "creator"
        ? "Creator on Bytestream"
        : "Learning with Bytestream",
      avatar: "",
      stats: {
        likes: totalLikesOnUploads,
        saved: savedCount,
        subscribers: subscribersCount,
        uploads: uploadsCount,
      },
    };

    const likedSet = new Set(likedVideos.map((video) => video.id));

    const mapVideo = (video: {
      id: number;
      videoTitle: string;
      creator: { username: string };
      _count: { videoLikes: number; comments: number };
      createdAt: Date;
    }) => ({
      id: video.id,
      title: video.videoTitle,
      creator: video.creator.username,
      creatorAvatar: "",
      thumbnail: "",
      duration: null,
      views: 0,
      likes: video._count.videoLikes,
      comments: video._count.comments,
      status: "published" as const,
      isLiked: likedSet.has(video.id),
    });

    const liked = likedVideos.map((video) => ({
      ...mapVideo(video),
      isLiked: true,
    }));

    const saved = savedEntries.map((entry) => ({
      ...mapVideo(entry.video),
      isLiked: likedSet.has(entry.video.id),
    }));

    const uploadsList = uploads.map((video) => ({
      ...mapVideo(video),
      isLiked: undefined,
    }));

    const creatorCounts = subscriptions.length === 0
      ? []
      : await prisma.subscription.groupBy({
          by: ["creatorId"],
          _count: { creatorId: true },
          where: { creatorId: { in: subscriptions.map((sub) => sub.creator.id) } },
        });

    const creatorsMap = new Map(
      creatorCounts.map((item) => [item.creatorId, item._count.creatorId]),
    );

    const subscriptionList = subscriptions.map((sub) => ({
      id: sub.creator.id,
      name: sub.creator.username,
      handle: `@${sub.creator.username}`,
      avatar: "",
      subscribers: creatorsMap.get(sub.creator.id) ?? 0,
      isSubscribed: true,
    }));

    const activityItems = [
      ...uploads.map((video) => ({
        id: `upload-${video.id}`,
        type: "uploaded" as const,
        text: "You published",
        target: video.videoTitle,
        timestamp: video.createdAt,
      })),
      ...savedEntries.map((entry) => ({
        id: `saved-${entry.id}`,
        type: "saved" as const,
        text: "You saved",
        target: entry.video.videoTitle,
        timestamp: entry.addedAt,
      })),
      ...subscriptions.map((sub) => ({
        id: `sub-${sub.creator.id}`,
        type: "subscribed" as const,
        text: "You subscribed to",
        target: sub.creator.username,
        timestamp: sub.createdAt,
      })),
      ...recentComments.map((comment) => ({
        id: `comment-${comment.id}`,
        type: "commented" as const,
        text: "You commented on",
        target: comment.video.videoTitle,
        timestamp: comment.createdAt,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        type: item.type,
        text: item.text,
        target: item.target,
        timeAgo: formatTimeAgo(item.timestamp),
      }));

    const recommendationList = recommendations.map((video) => ({
      ...mapVideo(video),
      isLiked: false,
    }));

    res.json({
      profile,
      likedVideos: liked,
      savedVideos: saved,
      uploads: uploadsList,
      subscriptions: subscriptionList,
      activity: activityItems,
      recommendations: recommendationList,
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};
