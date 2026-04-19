import { Router } from "express";
import { run, submit, getSubmissions, getSupportedLanguages } from "../controllers/submission.controller.js";
import { resolveDbUser, optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Code execution — no auth required to run/submit, but attach userId if token present
router.post("/execute", optionalAuth, run);
router.post("/run",    optionalAuth, run);
router.post("/submit", optionalAuth, submit);

// Submission history — requires login
router.get("/submissions", resolveDbUser, getSubmissions);

// Meta
router.get("/languages", getSupportedLanguages);

export default router;
