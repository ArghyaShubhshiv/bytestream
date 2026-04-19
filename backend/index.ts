import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import videoRoutes from "./routes/video.routes.js";
import userRoutes from "./routes/user.routes.js";
import interactionRoutes from "./routes/interaction.routes.js";
import watchLaterRoutes from "./routes/watchlater.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import { checkPistonHealth } from "./modules/judge/health.check.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "128kb" }));

// ── Rate limiting for code execution endpoints ──────────────────────────────
// Prevents abuse of the Piston sandbox (guests and logged-in users alike)
const runLimiter = rateLimit({
  windowMs: 60_000,       // 1-minute window
  max: 20,                // 20 runs per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many run requests. Please wait a moment before trying again." },
});

const submitLimiter = rateLimit({
  windowMs: 60_000,       // 1-minute window
  max: 10,                // 10 submits per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions. Please wait a moment before trying again." },
});

app.use("/api/run",    runLimiter);
app.use("/api/execute", runLimiter);
app.use("/api/submit", submitLimiter);

// Health check
app.get("/api/health", async (_req: Request, res: Response) => {
  res.status(200).json({ status: "ByteStream API live and working." });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/users", userRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/watchlater", watchLaterRoutes);
app.use("/api", submissionRoutes); // covers /api/run, /api/submit, /api/submissions, /api/languages

// ── Global error handler ────────────────────────────────────────────────────
// Catches any unhandled error thrown inside a route or middleware.
// Without this, Express sends a raw HTML error page or hangs the request.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Unhandled Error]", err);
  res.status(500).json({ error: "Internal server error. Please try again later." });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 ByteStream API running on http://localhost:${PORT}`);
  // Check Piston in background — don't block server start
  checkPistonHealth().catch((err) => {
    console.error("[health-check] Failed:", err instanceof Error ? err.message : String(err))
  });
});
