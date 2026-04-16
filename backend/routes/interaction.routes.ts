import { Router } from "express";
import { toggleVideoLike, toggleVideoDislike, toggleCommentLike, toggleCommentDislike } from "../controllers/interaction.controller";
import {getComments, addComment} from "../controllers/comment.controller";

import { resolveDbUser } from "../middleware/auth.middleware"; // 💥 Just need this now
import { toggleSubscribe } from "../controllers/subscription.controllers";

const router = Router();

// We inject resolveDbUser to ensure they are logged in AND in our DB
router.post("/videos/:videoId/like", resolveDbUser, toggleVideoLike);
router.post("/videos/:videoId/dislike", resolveDbUser, toggleVideoDislike);

// Comment interaction routes
router.post("/comment/:commentId/like", resolveDbUser, toggleCommentLike);
router.post("/comment/:commentId/dislike", resolveDbUser, toggleCommentDislike);

// Actually writing the comments
router.get("/videos/:videoId", getComments);    //no auth needed
router.post("/videos/:videoId", resolveDbUser, addComment);

// Subscribing
router.post("/subscribe/:creatorId", resolveDbUser, toggleSubscribe)

export default router;