import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getVideoFeed = async (req: Request, res: Response) => {
    try {
        const videos = await prisma.video.findMany({
            take: 10,
            orderBy: {createdAt: "desc"},
            include: {
                creator: {
                    select: {username: true}
                },
                codePane: true
            }
        })

        res.json(videos)
    }
    catch (err){
        console.error("Error in pulling video data", err)
    }
}