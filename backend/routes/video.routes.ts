import { Router } from "express";
import { getVideoFeed, getUploadUrl, confirmUpload, getVideoById, searchVideos } from "../controllers/video.controller.js";
// BUG FIX: optionalAuth needed so feed/search/getById can return likedByUser per video
import { optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

// BUG FIX: attach optionalAuth so controllers can look up per-user like/dislike state
router.get("/feed", optionalAuth, getVideoFeed);
router.get("/search", optionalAuth, searchVideos);
router.get("/upload-url", getUploadUrl);
router.get("/:videoId", optionalAuth, getVideoById);
router.post("/confirm", confirmUpload);

export default router;
