import { Router } from "express";
import { getVideoFeed, getUploadUrl, confirmUpload, getVideoById, searchVideos } from "../controllers/video.controller.js";

const router = Router();

router.get("/feed", getVideoFeed);
router.get("/search", searchVideos);
router.get("/upload-url", getUploadUrl);
router.get("/:videoId", getVideoById);
router.post("/confirm", confirmUpload);

export default router;
