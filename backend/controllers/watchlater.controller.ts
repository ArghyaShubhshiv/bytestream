import { Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const getWatchLater = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.internalUserId!;

  try {
    const entries = await prisma.watchLater.findMany({
      where: { userId },
      select: { videoId: true },
      orderBy: { addedAt: "desc" },
    });

    res.json(entries.map((entry: { videoId: number }) => entry.videoId));
  } catch (error) {
    console.error("Error fetching watch later list:", error);
    res.status(500).json({ error: "Failed to load watch later" });
  }
};

export const toggleWatchLater = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.internalUserId!;
  const videoId = Number(req.params.videoId);

  if (Number.isNaN(videoId)) {
    return res.status(400).json({ error: "Invalid video ID." });
  }

  try {
    const existing = await prisma.watchLater.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    if (existing) {
      await prisma.watchLater.delete({ where: { id: existing.id } });
      return res.json({ watchingLater: false, videoId });
    }

    await prisma.watchLater.create({
      data: { userId, videoId },
    });

    return res.json({ watchingLater: true, videoId });
  } catch (error) {
    console.error("Error toggling watch later:", error);
    res.status(500).json({ error: "Failed to update watch later" });
  }
};
