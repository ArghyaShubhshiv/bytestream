import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware"; // Import our secure type
import { prisma } from "../lib/prisma";

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

export const addComment = async (req: AuthenticatedRequest, res: Response) => {
    // 1. Pull the securely verified ID from the Clerk middleware
    const userId = req.internalUserId!; 
    const videoId = parseInt(req.params.videoId as string, 10);    
    const { text } = req.body;

    // If comment text is empty
    if (!text || text.trim() === "") {
        return res.status(400).json({ error: "Comment text cannot be empty." });
    }

    try {
        // 5. Write to the database
        const newComment = await prisma.comment.create({
            data: {
                text: text.trim(), // Sanitize trailing spaces
                videoId: videoId,
                userId: userId,
            },
            // We include the user's username in the response 
            // so the frontend doesn't have to make a second fetch to display the author!
            include: {
                user: {
                    select: { 
                        username: true 
                    }
                }
            }
        });

        // Send the fully populated comment back with a 201 Created status
        return res.status(201).json(newComment);

    } catch (error) {
        console.error("Error adding comment:", error);
        return res.status(500).json({ error: "Internal Server Error: Failed to post comment." });
    }
};