import { Router } from "express";
import { getVideoFeed, getUploadUrl, confirmUpload } from "../controllers/video.controller.js";

const router = Router();

router.get("/feed", getVideoFeed);
router.get("/upload-url", getUploadUrl);
router.post("/confirm", confirmUpload);

export default router;
