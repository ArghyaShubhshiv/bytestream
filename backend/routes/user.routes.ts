import { Router } from "express";
import { getUserData } from "../controllers/user.controller.js";

const router = Router();

router.get("/", getUserData);

export default router;
