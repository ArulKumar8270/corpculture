import express from "express";
import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import {
    createPayslipController,
    getAllPayslipsController,
    getMyPayslipsController,
    getOnePayslipController,
} from "../controllers/payslip/payslipController.js";

const router = express.Router();

// Health check so GET /api/v1/payslip returns 200 (verifies mount)
router.get("/", (req, res) => res.status(200).json({ success: true, message: "Payslip API" }));

router.post("/create", isAdmin, createPayslipController);
router.get("/all", requireSignIn, requirePermission("otherSettingsPayslip", "view"), getAllPayslipsController);
router.get("/my", requireSignIn, getMyPayslipsController);
router.get("/:id", requireSignIn, getOnePayslipController);

export default router;
