import express from "express";
import { requireSignIn } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import {
    getFrontHomeSettings,
    updateFrontHomeSettings,
    resetFrontHomeSettings,
} from "../controllers/frontHome/frontHomeSettingsController.js";

const router = express.Router();

router.get("/", getFrontHomeSettings);

router.put(
    "/",
    requireSignIn,
    requirePermission("otherSettingsFrontHome", "edit"),
    updateFrontHomeSettings
);

router.post(
    "/reset",
    requireSignIn,
    requirePermission("otherSettingsFrontHome", "edit"),
    resetFrontHomeSettings
);

export default router;
