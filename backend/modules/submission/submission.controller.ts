import { judgeSubmission } from "../judge/judge.service";
import prisma from "../../prisma";

const SUPPORTED_LANGUAGES = ["cpp", "python", "java"];

export const runCodeHandler = async (req: any, res: any) => {
  try {
    const { code, language, videoId, sampleOnly, stdin } = req.body;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ error: "Invalid language" });
    }

    if (!code || code.length > 50000) {
      return res.status(400).json({ error: "Invalid code" });
    }

    const vid = parseInt(videoId);
    if (isNaN(vid)) {
      return res.status(400).json({ error: "Invalid videoId" });
    }

    const video = await prisma.video.findUnique({
      where: { id: vid },
      include: { codePane: { include: { testCases: true } } },
    });

    if (!video || !video.codePane) {
      return res.status(404).json({ error: "Problem not found" });
    }

    const result = await judgeSubmission(
      video.codePane.testCases,
      code,
      language,
      sampleOnly ?? true
    );

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};