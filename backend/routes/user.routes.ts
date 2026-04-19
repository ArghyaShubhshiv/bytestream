import { Router } from "express";
import { getUserData, getUserProfile } from "../controllers/user.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getUserData);
router.get("/:username", optionalAuth, getUserProfile);

export default router;
