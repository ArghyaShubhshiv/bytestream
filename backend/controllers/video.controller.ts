import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../lib/prisma.js";
import { s3Client } from "../lib/s3Client.js";

export const getVideoFeed = async (_req: Request, res: Response) => {
  try {
    const videos = await prisma.video.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { username: true } },
        codePane: true,
      },
    });
    res.json(videos);
  } catch (err) {
    console.error("Error fetching video feed:", err);
    res.status(500).json({ error: "Failed to fetch video feed" });
  }
};

export const searchVideos = async (req: Request, res: Response) => {
  const query = String(req.query.query ?? "").trim();

  try {
    const videos = await prisma.video.findMany({
      where: {
        OR: [
          { videoTitle: { contains: query, mode: "insensitive" } },
          { codePane: { problemTitle: { contains: query, mode: "insensitive" } } },
          { codePane: { problemDescription: { contains: query, mode: "insensitive" } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { username: true } },
        codePane: true,
      },
    });

    res.json(videos);
  } catch (err) {
    console.error("Error searching videos:", err);
    res.status(500).json({ error: "Failed to search videos" });
  }
};

export const getUploadUrl = async (req: Request, res: Response) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const requestedContentType = String(req.query.contentType ?? "video/mp4").trim()
  const contentType = requestedContentType || "video/mp4"
  const extension = contentType.includes("webm")
    ? ".webm"
    : contentType.includes("ogg")
    ? ".ogv"
    : contentType.includes("mov")
    ? ".mov"
    : ".mp4"

  if (!bucketName) {
    return res.status(500).json({ error: "AWS_BUCKET_NAME is not configured" });
  }

  const key = `${randomUUID()}${extension}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 5,
    });

    return res.status(200).json({ uploadUrl, key });
  } catch (error) {
    console.error("Failed to generate upload URL:", error);
    return res.status(500).json({ error: "Failed to generate upload URL" });
  }
};

export const confirmUpload = async (req: Request, res: Response) => {
  const { title, description, authorId, fileKey, testCases } = req.body as {
    title?: string;
    description?: string;
    authorId?: number | string;
    fileKey?: string;
    testCases?: Array<{ input: string; expectedOutput: string }>;
  };

  const bucketName = process.env.AWS_BUCKET_NAME;

  if (!title || !description || !authorId || !fileKey) {
    return res.status(400).json({
      error: "title, description, authorId, and fileKey are required",
    });
  }

  if (!bucketName) {
    return res.status(500).json({ error: "AWS_BUCKET_NAME is not configured" });
  }

  const parsedAuthorId = Number(authorId);
  if (Number.isNaN(parsedAuthorId)) {
    return res.status(400).json({ error: "authorId must be a valid number" });
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
            testCases: Array.isArray(testCases) ? testCases : [],
          },
        },
      },
      include: {
        creator: { select: { username: true } },
        codePane: true,
      },
    });

    return res.status(201).json(createdVideo);
  } catch (error) {
    console.error("Failed to confirm upload:", error);
    return res.status(500).json({ error: "Failed to create video record" });
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  const videoId = Number(req.params.videoId)
  if (isNaN(videoId)) {
    return res.status(400).json({ error: "Invalid video ID." })
  }

  try {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        creator: { select: { username: true } },
        codePane: true,
      },
    })

    if (!video) {
      return res.status(404).json({ error: "Video not found." })
    }

    return res.json(video)
  } catch (err) {
    console.error("Error fetching video by ID:", err)
    return res.status(500).json({ error: "Failed to fetch video details" })
  }
};
