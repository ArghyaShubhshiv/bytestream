import { Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const toggleVideoLike = async (req: AuthenticatedRequest, res: Response) => {
  const videoId = parseInt(req.params.videoId as string, 10);
  const userId = req.internalUserId;
  if (!userId) return res.status(401).json({ error: "Authentication required" });

  try {
    const existingLike = await prisma.videoLikes.findUnique({
      where: { videoId_userId: { videoId, userId } },
    });

    if (existingLike) {
      await prisma.videoLikes.delete({
        where: { videoId_userId: { videoId, userId } },
      });
      const [likes, dislikes] = await Promise.all([
        prisma.videoLikes.count({ where: { videoId } }),
        prisma.videoDislikes.count({ where: { videoId } }),
      ]);
      return res.json({ liked: false, dislikeRemoved: false, likes, dislikes });
    } else {
      const dislikeRemoval = await prisma.videoDislikes.deleteMany({ where: { videoId, userId } });
      await prisma.videoLikes.create({ data: { videoId, userId } });
      const [likes, dislikes] = await Promise.all([
        prisma.videoLikes.count({ where: { videoId } }),
        prisma.videoDislikes.count({ where: { videoId } }),
      ]);
      return res.json({ liked: true, dislikeRemoved: dislikeRemoval.count > 0, likes, dislikes });
    }
  } catch (error) {
    console.error("Video Like Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const toggleVideoDislike = async (req: AuthenticatedRequest, res: Response) => {
  const videoId = parseInt(req.params.videoId as string, 10);
  const userId = req.internalUserId;
  if (!userId) return res.status(401).json({ error: "Authentication required" });

  try {
    const existingDislike = await prisma.videoDislikes.findUnique({
      where: { videoId_userId: { videoId, userId } },
    });

    if (existingDislike) {
      await prisma.videoDislikes.delete({
        where: { videoId_userId: { videoId, userId } },
      });
      const [likes, dislikes] = await Promise.all([
        prisma.videoLikes.count({ where: { videoId } }),
        prisma.videoDislikes.count({ where: { videoId } }),
      ]);
      return res.json({ disliked: false, likeRemoved: false, likes, dislikes });
    } else {
      const likeRemoval = await prisma.videoLikes.deleteMany({ where: { videoId, userId } });
      await prisma.videoDislikes.create({ data: { videoId, userId } });
      const [likes, dislikes] = await Promise.all([
        prisma.videoLikes.count({ where: { videoId } }),
        prisma.videoDislikes.count({ where: { videoId } }),
      ]);
      return res.json({ disliked: true, likeRemoved: likeRemoval.count > 0, likes, dislikes });
    }
  } catch (error) {
    console.error("Video Dislike Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const toggleCommentLike = async (req: AuthenticatedRequest, res: Response) => {
  const commentId = parseInt(req.params.commentId as string, 10);
  const userId = req.internalUserId;
  if (!userId) return res.status(401).json({ error: "Authentication required" });

  try {
    const existingLike = await prisma.commentLikes.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existingLike) {
      await prisma.commentLikes.delete({
        where: { commentId_userId: { commentId, userId } },
      });
      return res.json({ liked: false });
    } else {
      await prisma.commentDislikes.deleteMany({ where: { commentId, userId } });
      await prisma.commentLikes.create({ data: { commentId, userId } });
      return res.json({ liked: true });
    }
  } catch (error) {
    console.error("Comment Like Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const toggleCommentDislike = async (req: AuthenticatedRequest, res: Response) => {
  const commentId = parseInt(req.params.commentId as string, 10);
  const userId = req.internalUserId;
  if (!userId) return res.status(401).json({ error: "Authentication required" });

  try {
    const existingDislike = await prisma.commentDislikes.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existingDislike) {
      await prisma.commentDislikes.delete({
        where: { commentId_userId: { commentId, userId } },
      });
      return res.json({ disliked: false });
    } else {
      await prisma.commentLikes.deleteMany({ where: { commentId, userId } });
      await prisma.commentDislikes.create({ data: { commentId, userId } });
      return res.json({ disliked: true });
    }
  } catch (error) {
    console.error("Comment Dislike Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
