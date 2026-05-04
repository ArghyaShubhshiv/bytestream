import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../lib/prisma.js";
import { s3Client } from "../lib/s3Client.js";
import { cacheVideo, getCachedVideo, cacheFeed, getCachedFeed } from "../lib/redis.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

interface RawTestCase {
  input?: unknown;
  output?: unknown;
  expectedOutput?: unknown;
  isHidden?: unknown;
}

const normalizeTestCases = (testCases: unknown): Array<{ input: string; output: string; isHidden: boolean }> => {
  if (!Array.isArray(testCases)) return [];

  return testCases
    .map((tc) => {
      const item = tc as RawTestCase;
      const input = typeof item.input === "string" ? item.input.trim() : "";
      const outputValue = typeof item.output === "string"
        ? item.output
        : typeof item.expectedOutput === "string"
        ? item.expectedOutput
        : "";
      const output = outputValue.trim();

      if (!input || !output) return null;

      return {
        input,
        output,
        isHidden: Boolean(item.isHidden),
      };
    })
    .filter((tc): tc is { input: string; output: string; isHidden: boolean } => tc !== null);
};

const getObjectKeyFromUrl = (value: string): string | null => {
  try {
    const parsed = new URL(value);
    return parsed.pathname.replace(/^\//, "") || null;
  } catch {
    return null;
  }
};

const getPlayableVideoUrl = async (videoUrl: string | null): Promise<string | null> => {
  if (!videoUrl) return null;

  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) return videoUrl;

  const key = getObjectKeyFromUrl(videoUrl);
  if (!key) return videoUrl;

  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    return await getSignedUrl(s3Client, command, { expiresIn: 60 * 60 });
  } catch (error) {
    console.error("Failed to generate playback URL:", error);
    return videoUrl;
  }
};

export const getVideoFeed = async (_req: Request, res: Response) => {
  try {
    // Try to get from Redis cache first
    const cachedFeed = await getCachedFeed();
    if (cachedFeed) {
      return res.json(cachedFeed);
    }

    const videos = await prisma.video.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { username: true } },
        codePane: true,
        _count: { select: { videoLikes: true, videoDislikes: true } },
      },
    });

    const playableVideos = await Promise.all(
      videos.map(async (video) => ({
        ...video,
        likeCount: video._count.videoLikes,
        dislikeCount: video._count.videoDislikes,
        videoUrl: await getPlayableVideoUrl(video.videoUrl),
      })),
    );

    // Cache the feed for future requests
    await cacheFeed(playableVideos);

    res.json(playableVideos);
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
        _count: { select: { videoLikes: true, videoDislikes: true } },
      },
    });

    const playableVideos = await Promise.all(
      videos.map(async (video) => ({
        ...video,
        likeCount: video._count.videoLikes,
        dislikeCount: video._count.videoDislikes,
        videoUrl: await getPlayableVideoUrl(video.videoUrl),
      })),
    );

    res.json(playableVideos);
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
  const { title, problemTitle, description, authorId, fileKey, testCases } = req.body as {
    title?: string;
    problemTitle?: string;
    description?: string;
    authorId?: number | string;
    fileKey?: string;
    testCases?: unknown;
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
  const normalizedProblemTitle = (problemTitle ?? title).trim();
  const normalizedTestCases = normalizeTestCases(testCases);

  if (!normalizedProblemTitle) {
    return res.status(400).json({ error: "problemTitle is required" });
  }
  if (normalizedTestCases.length === 0) {
    return res.status(400).json({ error: "At least one valid test case is required" });
  }

  try {
    const createdVideo = await prisma.video.create({
      data: {
        videoTitle: title,
        videoUrl,
        creator: {
          connect: { id: parsedAuthorId },
        },
        codePane: {
          create: {
            problemTitle: normalizedProblemTitle,
            problemDescription: description,
            testCases: normalizedTestCases,
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

export const deleteVideo = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.internalUserId!;
  const videoId = Number(req.params.videoId);

  if (Number.isNaN(videoId)) {
    return res.status(400).json({ error: "Invalid video ID." });
  }

  try {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, creatorId: true },
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found." });
    }

    if (video.creatorId !== userId) {
      return res.status(403).json({ error: "Not allowed to delete this video." });
    }

    await prisma.$transaction([
      prisma.commentLikes.deleteMany({ where: { comment: { videoId } } }),
      prisma.commentDislikes.deleteMany({ where: { comment: { videoId } } }),
      prisma.comment.deleteMany({ where: { videoId } }),
      prisma.videoLikes.deleteMany({ where: { videoId } }),
      prisma.videoDislikes.deleteMany({ where: { videoId } }),
      prisma.watchLater.deleteMany({ where: { videoId } }),
      prisma.video.delete({ where: { id: videoId } }),
    ]);

    return res.status(200).json({ deleted: true, videoId });
  } catch (error) {
    console.error("Failed to delete video:", error);
    return res.status(500).json({ error: "Failed to delete video" });
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  const videoId = Number(req.params.videoId)
  if (isNaN(videoId)) {
    return res.status(400).json({ error: "Invalid video ID." })
  }

  try {
    // Try to get from Redis cache first
    const cachedVideo = await getCachedVideo(videoId);
    if (cachedVideo) {
      return res.json(cachedVideo);
    }

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        creator: { select: { username: true } },
        codePane: true,
        _count: { select: { videoLikes: true, videoDislikes: true } },
      },
    })

    if (!video) {
      return res.status(404).json({ error: "Video not found." })
    }

    const videoData = {
      ...video,
      likeCount: video._count.videoLikes,
      dislikeCount: video._count.videoDislikes,
      videoUrl: await getPlayableVideoUrl(video.videoUrl),
    }

    // Cache the video for future requests
    await cacheVideo(videoId, videoData);

    return res.json(videoData)
  } catch (err) {
    console.error("Error fetching video by ID:", err)
    return res.status(500).json({ error: "Failed to fetch video details" })
  }
};