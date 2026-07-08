import { Router } from "express";
import { getUserData, getUserProfile, getUserDashboard } from "../controllers/user.controller.js";
import { optionalAuth, resolveDbUser } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getUserData);
router.get("/me/dashboard", resolveDbUser, getUserDashboard);
router.get("/:username", optionalAuth, getUserProfile);

export default router;
