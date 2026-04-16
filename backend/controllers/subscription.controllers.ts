import { Request, Response } from "express";
import {prisma} from "../lib/prisma"
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const toggleSubscribe = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.internalUserId!;
    const creatorId = parseInt(req.params.creatorId as string, 10)

    if (!creatorId || isNaN(creatorId)) {
        return res.status(400).json({ error: "Valid creatorId is required." });
    }

    if (userId === creatorId) {
        return res.status(400).json({ error: "You cannot subscribe to yourself." });
    }

    try {
        const alreadySubscribed = await prisma.subscription.findUnique({
            where: {
                subscriberId_creatorId: {subscriberId: userId, creatorId}
            }
        })

        if (alreadySubscribed){
            await prisma.subscription.delete({
                where: {
                    subscriberId_creatorId: {subscriberId: userId, creatorId}
                }
            })
            return res.status(200).json({ subscribed: false });
        }
        else {
            await prisma.subscription.create({
                data: {
                    subscriberId: userId,
                    creatorId
                }
            })
            return res.status(200).json({ subscribed: true });
        }
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal error in subscribing."
        })
    }

}