import { Router } from "express";
import { getVideoFeed, getUploadUrl, confirmUpload, getVideoById, searchVideos, deleteVideo } from "../controllers/video.controller.js";
import { resolveDbUser } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/feed", getVideoFeed);
router.get("/search", searchVideos);
router.get("/upload-url", getUploadUrl);
router.get("/:videoId", getVideoById);
router.post("/confirm", confirmUpload);
router.delete("/:videoId", resolveDbUser, deleteVideo);

export default router;
