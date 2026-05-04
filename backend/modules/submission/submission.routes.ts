import express from "express";
import { runCodeHandler } from "./submission.controller.js";
import { optionalAuth, resolveDbUser } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/run", optionalAuth, runCodeHandler);
router.post("/submit", resolveDbUser, runCodeHandler);

export default router;
