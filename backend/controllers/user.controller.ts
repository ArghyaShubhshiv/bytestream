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
