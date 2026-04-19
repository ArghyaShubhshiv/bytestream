import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

export const getComments = async (req: AuthenticatedRequest, res: Response) => {
  const videoId = parseInt((req.params as Record<string, string>).videoId as string, 10);
  const userId = req.internalUserId;

  try {
    const comments = await prisma.comment.findMany({
      where: { videoId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true } } },
    });

    if (!userId) {
      return res.json(comments);
    }

    const liked = await prisma.commentLike.findMany({
      where: { userId, commentId: { in: comments.map((comment: any) => comment.id) } },
      select: { commentId: true },
    });
    const disliked = await prisma.commentDislike.findMany({
      where: { userId, commentId: { in: comments.map((comment: any) => comment.id) } },
      select: { commentId: true },
    });

    const likedSet = new Set(liked.map((item: { commentId: number }) => item.commentId));
    const dislikedSet = new Set(disliked.map((item: { commentId: number }) => item.commentId));

    const commentsWithReactions = comments.map((comment: any) => ({
      ...comment,
      likedByUser: likedSet.has(comment.id),
      dislikedByUser: dislikedSet.has(comment.id),
    }));

    res.json(commentsWithReactions);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.internalUserId!;
  const videoId = parseInt((req.params as Record<string, string>).videoId as string, 10);
  const { text } = req.body as { text: string };

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
