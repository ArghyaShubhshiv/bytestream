import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// FAKING AUTH
const CURRENT_USER_ID = 1;

// ==========================================
// VIDEO INTERACTIONS (Fixed)
// ==========================================

export const toggleVideoLike = async (req: Request, res: Response) => {
    const videoId = parseInt(req.params.videoId as string, 10);

    try {
        const existingLike = await prisma.videoLikes.findUnique({
            where: { videoId_userId: { videoId, userId: CURRENT_USER_ID } }
        });

        if (existingLike) {
            // REMOVE LIKE
            await prisma.videoLikes.delete({
                where: { videoId_userId: { videoId, userId: CURRENT_USER_ID } }
            });
            return res.json({ liked: false });
        } else {
            // 💥 FIX: Use deleteMany to safely remove existing dislikes without crashing if they don't exist
            await prisma.videoDislikes.deleteMany({
                where: { videoId, userId: CURRENT_USER_ID }
            });

            // 💥 FIX: Added the missing await
            await prisma.videoLikes.create({
                data: { videoId, userId: CURRENT_USER_ID }
            });
            return res.json({ liked: true });
        }
    } catch (error) {
        console.error("Video Like Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const toggleVideoDislike = async (req: Request, res: Response) => {
    const videoId = parseInt(req.params.videoId as string, 10);

    try {
        // 💥 FIX: Query the correct table!
        const existingDislike = await prisma.videoDislikes.findUnique({
            where: { videoId_userId: { videoId, userId: CURRENT_USER_ID } }
        });

        if (existingDislike) {
            await prisma.videoDislikes.delete({
                where: { videoId_userId: { videoId, userId: CURRENT_USER_ID } }
            });
            return res.json({ disliked: false });
        } else {
            // 💥 FIX: Use deleteMany
            await prisma.videoLikes.deleteMany({
                where: { videoId, userId: CURRENT_USER_ID }
            });

            // 💥 FIX: Added the missing await
            await prisma.videoDislikes.create({
                data: { videoId, userId: CURRENT_USER_ID }
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

export const toggleCommentLike = async (req: Request, res: Response) => {
    // Note: We expect 'commentId' from the URL parameters now
    const commentId = parseInt(req.params.commentId as string, 10);

    try {
        const existingLike = await prisma.commentLikes.findUnique({
            where: { commentId_userId: { commentId, userId: CURRENT_USER_ID } }
        });

        if (existingLike) {
            await prisma.commentLikes.delete({
                where: { commentId_userId: { commentId, userId: CURRENT_USER_ID } }
            });
            return res.json({ liked: false });
        } else {
            await prisma.commentDislikes.deleteMany({
                where: { commentId, userId: CURRENT_USER_ID }
            });

            await prisma.commentLikes.create({
                data: { commentId, userId: CURRENT_USER_ID }
            });
            return res.json({ liked: true });
        }
    } catch (error) {
        console.error("Comment Like Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const toggleCommentDislike = async (req: Request, res: Response) => {
    const commentId = parseInt(req.params.commentId as string, 10);

    try {
        const existingDislike = await prisma.commentDislikes.findUnique({
            where: { commentId_userId: { commentId, userId: CURRENT_USER_ID } }
        });

        if (existingDislike) {
            await prisma.commentDislikes.delete({
                where: { commentId_userId: { commentId, userId: CURRENT_USER_ID } }
            });
            return res.json({ disliked: false });
        } else {
            await prisma.commentLikes.deleteMany({
                where: { commentId, userId: CURRENT_USER_ID }
            });

            await prisma.commentDislikes.create({
                data: { commentId, userId: CURRENT_USER_ID }
            });
            return res.json({ disliked: true });
        }
    } catch (error) {
        console.error("Comment Dislike Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ==========================================
// COMMENT CRUD (Kept from earlier)
// ==========================================

export const getComments = async (req: Request, res: Response) => {
    const videoId = parseInt(req.params.videoId as string, 10);
    try {
        const comments = await prisma.comment.findMany({
            where: { videoId },
            orderBy: { createdAt: "desc" },
            include: { user: { select: { username: true } } },
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch comments" });
    }
};

export const addComment = async (req: Request, res: Response) => {
    const videoId = parseInt(req.params.videoId as string, 10);
    const { text } = req.body;

    if (!text || text.trim() === "") {
        return res.status(400).json({ error: "Comment text is required" });
    }

    try {
        const newComment = await prisma.comment.create({
            data: { text, videoId, userId: CURRENT_USER_ID },
            include: { user: { select: { username: true } } },
        });
        res.json(newComment);
    } catch (error) {
        res.status(500).json({ error: "Failed to post comment" });
    }
};