import { Router } from "express";
import { getWatchLater, toggleWatchLater } from "../controllers/watchlater.controller.js";
import { resolveDbUser } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", resolveDbUser, getWatchLater);
router.post("/:videoId", resolveDbUser, toggleWatchLater);

export default router;
