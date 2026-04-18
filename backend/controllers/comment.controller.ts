import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

export const getComments = async (req: Request, res: Response) => {
  const videoId = parseInt(req.params.videoId as string, 10);
  try {
    const comments = await prisma.comment.findMany({
      where: { videoId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true } } },
    });
    res.json(comments);
  } catch {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.internalUserId!;
  const videoId = parseInt(req.params.videoId as string, 10);
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Comment text cannot be empty." });
  }

  try {
    const newComment = await prisma.comment.create({
      data: {
        text: text.trim(),
        videoId,
        userId,
      },
      include: {
        user: { select: { username: true } },
      },
    });

    return res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ error: "Failed to post comment." });
  }
};
