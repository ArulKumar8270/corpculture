import express from "express";
import { requireSignIn, isAdmin } from "../middleware/authMiddleware.js";
import {
    createActivityLogController,
    getActivityLogsController,
    getActivityLogByIdController,
    updateActivityLogController,
    deleteActivityLogController,
    getAllActivityLogsController,
    updateActivityLogStatusAdminController,
} from "../controllers/employee/employeeActivityLogController.js";

const router = express.Router();

// Create Activity Log || POST (Employee only)
router.post("/create", requireSignIn, createActivityLogController);

// Get Activity Logs for logged-in employee || GET (Employee only)
router.get("/my-logs", requireSignIn, getActivityLogsController);

// Get Activity Log by ID || GET (Employee only)
router.get("/:id", requireSignIn, getActivityLogByIdController);

// Update Activity Log || PUT (Employee only)
router.put("/update/:id", requireSignIn, updateActivityLogController);

// Delete Activity Log || DELETE (Employee only)
router.delete("/delete/:id", requireSignIn, deleteActivityLogController);

// Get All Activity Logs || GET (Admin only)
router.get("/admin/all", isAdmin, getAllActivityLogsController);

// Update Activity Log Status || PUT (Admin only)
router.put("/admin/status/:id", isAdmin, updateActivityLogStatusAdminController);

export default router;

