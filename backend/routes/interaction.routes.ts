import { Router } from "express";
import {
  toggleVideoLike,
  toggleVideoDislike,
  toggleCommentLike,
  toggleCommentDislike,
} from "../controllers/interaction.controller.js";
import { getComments, addComment } from "../controllers/comment.controller.js";
import { optionalAuth, resolveDbUser } from "../middleware/auth.middleware.js";
import { toggleSubscribe } from "../controllers/subscription.controllers.js";

const router = Router();

// Video interactions (auth required)
router.post("/videos/:videoId/like", resolveDbUser, toggleVideoLike);
router.post("/videos/:videoId/dislike", resolveDbUser, toggleVideoDislike);

// Comment interactions (auth required)
router.post("/comment/:commentId/like", resolveDbUser, toggleCommentLike);
router.post("/comment/:commentId/dislike", resolveDbUser, toggleCommentDislike);

// Comments (read = public, write = auth)
router.get("/videos/:videoId", optionalAuth, getComments);
router.post("/videos/:videoId", resolveDbUser, addComment);

// Subscriptions (auth required)
router.post("/subscribe/:creatorId", resolveDbUser, toggleSubscribe);

export default router;
