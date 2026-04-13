import {Router} from "express"
import {getVideoFeed} from "../controllers/video.controller"

const router = Router()

router.get("/feed", getVideoFeed)

export default router;