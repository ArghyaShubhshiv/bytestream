import {Router} from "express"
import {confirmUpload, getVideoFeed, getUploadUrl} from "../controllers/video.controller"

const router = Router()

router.get("/feed", getVideoFeed)
router.get("/upload-url", getUploadUrl)
router.post("/confirm", confirmUpload)

export default router;