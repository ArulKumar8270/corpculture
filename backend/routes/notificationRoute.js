import express from "express";
import { requireSignIn } from "../middleware/authMiddleware.js";
import {
    registerPushToken,
    removePushToken,
} from "../controllers/notification/notificationController.js";

const router = express.Router();

router.post("/register-token", requireSignIn, registerPushToken);
router.post("/remove-token", requireSignIn, removePushToken);

export default router;
