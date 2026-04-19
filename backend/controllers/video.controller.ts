import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../lib/prisma.js";
import { s3Client } from "../lib/s3Client.js";

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

export const getVideoFeed = async (req: Request, res: Response) => {
  // BUG FIX: cast to AuthenticatedRequest so we can read internalUserId set by optionalAuth
  const userId = (req as AuthenticatedRequest).internalUserId ?? null;

  try {
    const videos = await prisma.video.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { username: true } },
        codePane: true,
        _count: { select: { videoLikes: true, videoDislikes: true } },
      },
    });

    // BUG FIX: fetch this user's like/dislike state for all returned videos in one query each,
    // so the frontend can restore the correct button state when switching between videos.
    const videoIds = videos.map((v) => v.id);
    const [userLikes, userDislikes] = userId
      ? await Promise.all([
          prisma.videoLikes.findMany({ where: { userId, videoId: { in: videoIds } }, select: { videoId: true } }),
          prisma.videoDislikes.findMany({ where: { userId, videoId: { in: videoIds } }, select: { videoId: true } }),
        ])
      : [[], []];
    const likedSet = new Set(userLikes.map((l) => l.videoId));
    const dislikedSet = new Set(userDislikes.map((d) => d.videoId));

    const playableVideos = await Promise.all(
      videos.map(async (video) => ({
        ...video,
        likeCount: video._count.videoLikes,
        dislikeCount: video._count.videoDislikes,
        likedByUser: likedSet.has(video.id),
        dislikedByUser: dislikedSet.has(video.id),
        videoUrl: await getPlayableVideoUrl(video.videoUrl),
      })),
    );

    res.json(playableVideos);
  } catch (err) {
    console.error("Error fetching video feed:", err);
    res.status(500).json({ error: "Failed to fetch video feed" });
  }
};

export const searchVideos = async (req: Request, res: Response) => {
  const query = String(req.query.query ?? "").trim();
  if (!query || query.length > 500) {
    return res.json([]);
  }
  // BUG FIX: read userId from optionalAuth so search results also carry likedByUser state
  const userId = (req as AuthenticatedRequest).internalUserId ?? null;

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

    const videoIds = videos.map((v) => v.id);
    const [userLikes, userDislikes] = userId
      ? await Promise.all([
          prisma.videoLikes.findMany({ where: { userId, videoId: { in: videoIds } }, select: { videoId: true } }),
          prisma.videoDislikes.findMany({ where: { userId, videoId: { in: videoIds } }, select: { videoId: true } }),
        ])
      : [[], []];
    const likedSet = new Set(userLikes.map((l) => l.videoId));
    const dislikedSet = new Set(userDislikes.map((d) => d.videoId));

    const playableVideos = await Promise.all(
      videos.map(async (video) => ({
        ...video,
        likeCount: video._count.videoLikes,
        dislikeCount: video._count.videoDislikes,
        likedByUser: likedSet.has(video.id),
        dislikedByUser: dislikedSet.has(video.id),
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

  const validateTestCases = (tc: unknown): boolean => {
    if (!Array.isArray(tc)) return false
    return tc.every(
      (item) => item && typeof item === 'object' && 
      'input' in item && 'expectedOutput' in item &&
      typeof item.input === 'string' && typeof item.expectedOutput === 'string'
    )
  }

  if (testCases && !validateTestCases(testCases)) {
    return res.status(400).json({ error: "Invalid test cases format" })
  }

  const videoUrl = `https://${bucketName}.s3.amazonaws.com/${fileKey}`;

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
            problemTitle: (problemTitle ?? title).trim(),
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
  if (!Number.isInteger(videoId) || videoId <= 0) {
    return res.status(400).json({ error: "Invalid video ID." })
  }

  try {
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

    // BUG FIX: include per-user like/dislike state in the detail view too
    const userId = (req as AuthenticatedRequest).internalUserId ?? null;
    const [userLike, userDislike] = userId
      ? await Promise.all([
          prisma.videoLikes.findUnique({ where: { videoId_userId: { videoId: video.id, userId } } }),
          prisma.videoDislikes.findUnique({ where: { videoId_userId: { videoId: video.id, userId } } }),
        ])
      : [null, null];

    return res.json({
      ...video,
      likeCount: video._count.videoLikes,
      dislikeCount: video._count.videoDislikes,
      likedByUser: userLike !== null,
      dislikedByUser: userDislike !== null,
      videoUrl: await getPlayableVideoUrl(video.videoUrl),
    })
  } catch (err) {
    console.error("Error fetching video by ID:", err)
    return res.status(500).json({ error: "Failed to fetch video details" })
  }
};
