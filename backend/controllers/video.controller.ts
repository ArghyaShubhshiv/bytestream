import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../lib/prisma";
import { s3Client } from "../lib/s3Client";

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

export const getUploadUrl = async (req: Request, res: Response) => {
    const bucketName = process.env.AWS_BUCKET_NAME;

    if (!bucketName) {
        return res.status(500).json({
            error: "AWS_BUCKET_NAME is not configured"
        });
    }

    const key = `${randomUUID()}.mp4`;

    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: "video/mp4"
        });

        const uploadUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 60 * 5,
        });

        return res.status(200).json({
            uploadUrl,
            key,
        });
    } catch (error) {
        console.error("Failed to generate upload URL", error);
        return res.status(500).json({
            error: "Failed to generate upload URL",
        });
    }
};

export const confirmUpload = async (req: Request, res: Response) => {
    const { title, description, authorId, fileKey } = req.body as {
        title?: string;
        description?: string;
        authorId?: number | string;
        fileKey?: string;
    };

    const bucketName = process.env.AWS_BUCKET_NAME;

    if (!title || !description || !authorId || !fileKey) {
        return res.status(400).json({
            error: "title, description, authorId, and fileKey are required",
        });
    }

    if (!bucketName) {
        return res.status(500).json({
            error: "AWS_BUCKET_NAME is not configured",
        });
    }

    const parsedAuthorId = Number(authorId);
    if (Number.isNaN(parsedAuthorId)) {
        return res.status(400).json({
            error: "authorId must be a valid number",
        });
    }

    const videoUrl = `https://${bucketName}.s3.amazonaws.com/${fileKey}`;

    try {
        const createdVideo = await prisma.video.create({
            data: {
                videoTitle: title,
                videoUrl,
                creatorId: parsedAuthorId,
                codePane: {
                    create: {
                        problemTitle: title,
                        problemDescription: description,
                        testCases: [],
                    },
                },
            },
            include: {
                creator: {
                    select: { username: true },
                },
                codePane: true,
            },
        });

        return res.status(201).json(createdVideo);
    } catch (error) {
        console.error("Failed to confirm upload", error);
        return res.status(500).json({
            error: "Failed to create video record",
        });
    }
};