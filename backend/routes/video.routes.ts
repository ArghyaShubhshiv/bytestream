import { Router } from "express";
import { getVideoFeed, getUploadUrl, confirmUpload, getVideoById, searchVideos, deleteVideo } from "../controllers/video.controller.js";
import { resolveDbUser, optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/feed",optionalAuth , getVideoFeed);
router.get("/search",optionalAuth , searchVideos);
router.get("/upload-url", getUploadUrl);
router.get("/:videoId",optionalAuth , getVideoById);
router.post("/confirm", confirmUpload);
router.delete("/:videoId", resolveDbUser, deleteVideo);

export default router;
