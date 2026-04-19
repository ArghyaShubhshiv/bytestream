import { Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const toggleSubscribe = async (req: AuthenticatedRequest, res: Response) => {
  const subscriberId = req.internalUserId!;
  const creatorId = parseInt(req.params.creatorId, 10);

  if (isNaN(creatorId)) {
    return res.status(400).json({ error: "Invalid creatorId." });
  }

  if (subscriberId === creatorId) {
    return res.status(400).json({ error: "You cannot subscribe to yourself." });
  }

  try {
    const creator = await prisma.user.findUnique({ where: { id: creatorId } });
    if (!creator) return res.status(404).json({ error: "Creator not found." });

    const existing = await prisma.subscription.findUnique({
      where: { subscriberId_creatorId: { subscriberId, creatorId } },
    });

    if (existing) {
      await prisma.subscription.delete({
        where: { subscriberId_creatorId: { subscriberId, creatorId } },
      });
      const followerCount = await prisma.subscription.count({ where: { creatorId } });
      return res.json({ subscribed: false, followerCount });
    }

    await prisma.subscription.create({ data: { subscriberId, creatorId } });
    const followerCount = await prisma.subscription.count({ where: { creatorId } });
    return res.json({ subscribed: true, followerCount });
  } catch (err) {
    console.error("[toggleSubscribe] Error:", err);
    return res.status(500).json({ error: "Failed to update subscription." });
  }
};
