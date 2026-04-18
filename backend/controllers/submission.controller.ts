import { Request, Response } from "express";
import { judgeSubmission, TestCase } from "../modules/judge/judge.service.js";
import { SUPPORTED_LANGUAGES } from "../modules/judge/piston.service.js";
import { prisma } from "../lib/prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

// Per-session in-flight lock: prevents parallel submissions for the same video
const inFlight = new Set<string>();

export async function run(req: Request, res: Response) {
  return _judge(req, res, true);
}

export async function submit(req: Request, res: Response) {
  return _judge(req, res, false);
}

async function _judge(req: Request, res: Response, sampleOnly: boolean) {
  const { code, language, videoId } = req.body;

  // ── Input validation ────────────────────────────────────────────────────────
  if (!code || !language || videoId === undefined) {
    return res.status(400).json({ error: "code, language, and videoId are required." });
  }
  if (typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({ error: "code must be a non-empty string." });
  }
  if (code.length > 65536) {
    return res.status(400).json({ error: "code exceeds the 64 KB size limit." });
  }
  if (!SUPPORTED_LANGUAGES[language]) {
    return res.status(400).json({
      error: `Unsupported language: "${language}". Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(", ")}`,
    });
  }
  const parsedVideoId = Number(videoId);
  if (isNaN(parsedVideoId)) {
    return res.status(400).json({ error: "videoId must be a number." });
  }

  // ── In-flight lock: one submission per video at a time per session ──────────
  const userId = (req as AuthenticatedRequest).internalUserId;
  const lockKey = `${userId ?? req.ip}:${parsedVideoId}`;
  if (inFlight.has(lockKey)) {
    return res.status(429).json({ error: "A submission is already running. Please wait." });
  }
  inFlight.add(lockKey);

  try {
    // ── Fetch problem ───────────────────────────────────────────────────────────
    const video = await prisma.video.findUnique({
      where: { id: parsedVideoId },
      include: { codePane: true },
    });
    if (!video) return res.status(404).json({ error: "Video not found." });
    if (!video.codePane) return res.status(404).json({ error: "No coding problem attached to this video yet." });

    const testcases = Array.isArray(video.codePane.testCases)
      ? (video.codePane.testCases as TestCase[])
      : [];
    if (testcases.length === 0) {
      return res.status(400).json({ error: "No test cases defined for this problem yet." });
    }

    // ── Judge ───────────────────────────────────────────────────────────────────
    const result = await judgeSubmission(testcases, code, language, sampleOnly);

    // ── Persist (only for full submit, not sample runs) ─────────────────────────
    if (!sampleOnly) {
      try {
        await prisma.submission.create({
          data: {
            userId: userId ?? null,
            codePaneId: video.codePane.id,
            language,
            code,
            status: result.status,
            passedCount: result.passedCount,
            totalCount: result.totalCount,
            executionTimeMs: result.executionTimeMs ?? null,
            error: result.error ?? null,
          },
        });
      } catch (dbErr) {
        console.error("[submit] Failed to save submission:", dbErr);
      }
    }

    return res.json({ ...result, mode: sampleOnly ? "run" : "submit" });
  } finally {
    inFlight.delete(lockKey);
  }
}

// GET /api/submissions?videoId=X — submission history for the active user
export async function getSubmissions(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).internalUserId;
  const videoId = Number(req.query.videoId);
  if (isNaN(videoId)) return res.status(400).json({ error: "videoId query param required." });

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { codePaneId: true },
  });
  if (!video) return res.status(404).json({ error: "Video not found." });

  const submissions = await prisma.submission.findMany({
    where: { codePaneId: video.codePaneId, userId: userId ?? undefined },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true, status: true, language: true,
      passedCount: true, totalCount: true,
      executionTimeMs: true, createdAt: true,
      // Don't return full code in the list — too heavy
    },
  });
  return res.json(submissions);
}

export async function getSupportedLanguages(_req: Request, res: Response) {
  return res.json({ languages: Object.keys(SUPPORTED_LANGUAGES) });
}
