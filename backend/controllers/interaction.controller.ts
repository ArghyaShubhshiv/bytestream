import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const toggleVideoLike = async (req: AuthenticatedRequest, res: Response) => {
    const videoId = parseInt(req.params.videoId as string, 10);
    const userId = req.internalUserId!; 

    try {
        const existingLike = await prisma.videoLikes.findUnique({
            where: { videoId_userId: { videoId, userId } }
        });

        if (existingLike) {
            // REMOVE LIKE
            await prisma.videoLikes.delete({
                where: { videoId_userId: { videoId, userId } }
            });
            return res.json({ liked: false });
        } else {
            // 💥 FIX: Use deleteMany to safely remove existing dislikes without crashing if they don't exist
            await prisma.videoDislikes.deleteMany({
                where: { videoId, userId }
            });

            // 💥 FIX: Added the missing await
            await prisma.videoLikes.create({
                data: { videoId, userId }
            });
            return res.json({ liked: true });
        }
    } catch (error) {
        console.error("Video Like Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const toggleVideoDislike = async (req: AuthenticatedRequest, res: Response) => {
    const videoId = parseInt(req.params.videoId as string, 10);
    const userId = req.internalUserId!; 

    try {
        // 💥 FIX: Query the correct table!
        const existingDislike = await prisma.videoDislikes.findUnique({
            where: { videoId_userId: { videoId, userId } }
        });

        if (existingDislike) {
            await prisma.videoDislikes.delete({
                where: { videoId_userId: { videoId, userId } }
            });
            return res.json({ disliked: false });
        } else {
            // 💥 FIX: Use deleteMany
            await prisma.videoLikes.deleteMany({
                where: { videoId, userId }
            });

            // 💥 FIX: Added the missing await
            await prisma.videoDislikes.create({
                data: { videoId, userId }
            });
            return res.json({ disliked: true });
        }
    } catch (error) {
        console.error("Video Dislike Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ==========================================
// COMMENT INTERACTIONS (New)
// ==========================================

export const toggleCommentLike = async (req: AuthenticatedRequest, res: Response) => {
    // Note: We expect 'commentId' from the URL parameters now
    const commentId = parseInt(req.params.commentId as string, 10);
    const userId = req.internalUserId!; 

    try {
        const existingLike = await prisma.commentLikes.findUnique({
            where: { commentId_userId: { commentId, userId } }
        });

        if (existingLike) {
            await prisma.commentLikes.delete({
                where: { commentId_userId: { commentId, userId } }
            });
            return res.json({ liked: false });
        } else {
            await prisma.commentDislikes.deleteMany({
                where: { commentId, userId }
            });

            await prisma.commentLikes.create({
                data: { commentId, userId }
            });
            return res.json({ liked: true });
        }
    } catch (error) {
        console.error("Comment Like Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const toggleCommentDislike = async (req: AuthenticatedRequest, res: Response) => {
    const commentId = parseInt(req.params.commentId as string, 10);
    const userId = req.internalUserId!; 

    try {
        const existingDislike = await prisma.commentDislikes.findUnique({
            where: { commentId_userId: { commentId, userId } }
        });

        if (existingDislike) {
            await prisma.commentDislikes.delete({
                where: { commentId_userId: { commentId, userId } }
            });
            return res.json({ disliked: false });
        } else {
            await prisma.commentLikes.deleteMany({
                where: { commentId, userId }
            });

            await prisma.commentDislikes.create({
                data: { commentId, userId }
            });
            return res.json({ disliked: true });
        }
    } catch (error) {
        console.error("Comment Dislike Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

