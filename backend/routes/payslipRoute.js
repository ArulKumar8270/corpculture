import express from "express";
import { requireSignIn, isAdminOrEmployee } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import {
    createPayslipController,
    getAllPayslipsController,
    getMyPayslipsController,
    getOnePayslipController,
    updatePayslipController,
    deletePayslipController,
    restorePayslipController,
} from "../controllers/payslip/payslipController.js";

const router = express.Router();

// Health check so GET /api/v1/payslip returns 200 (verifies mount)
router.get("/", (req, res) => res.status(200).json({ success: true, message: "Payslip API" }));

router.post("/create", isAdminOrEmployee, createPayslipController);
router.get("/all", requireSignIn, requirePermission("otherSettingsPayslip", "view"), getAllPayslipsController);
router.get("/my", requireSignIn, getMyPayslipsController);
router.post("/restore/:id", requireSignIn, requirePermission("otherSettingsPayslip", "delete"), restorePayslipController);
router.put("/:id", requireSignIn, requirePermission("otherSettingsPayslip", "edit"), updatePayslipController);
router.delete("/:id", requireSignIn, requirePermission("otherSettingsPayslip", "delete"), deletePayslipController);
router.get("/:id", requireSignIn, getOnePayslipController);

export default router;
