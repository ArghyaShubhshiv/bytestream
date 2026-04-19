import express from "express";
import { runCodeHandler } from "./submission.controller";
import { resolveDbUserOptional, resolveDbUser } from "../auth/middleware";

const router = express.Router();

router.post("/run", resolveDbUserOptional, runCodeHandler);
router.post("/submit", resolveDbUser, runCodeHandler);

export default router;