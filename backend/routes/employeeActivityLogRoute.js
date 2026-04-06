import express from "express";
import { requireSignIn, isAdmin, isAdminOrEmployee } from "../middleware/authMiddleware.js";
import {
    createActivityLogController,
    getActivityLogsController,
    getActivityLogByIdController,
    updateActivityLogController,
    deleteActivityLogController,
    getAllActivityLogsController,
    updateActivityLogStatusAdminController,
    getActivityLogByIdAdminController,
    updateActivityLogAdminController,
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
router.get("/admin/all", isAdminOrEmployee, getAllActivityLogsController);

// Update Activity Log Status || PUT (Admin only)
router.put("/admin/status/:id", isAdminOrEmployee, updateActivityLogStatusAdminController);

// Get Activity Log by ID || GET (Admin only)
router.get("/admin/:id", isAdminOrEmployee, getActivityLogByIdAdminController);

// Update Activity Log || PUT (Admin only)
router.put("/admin/update/:id", isAdminOrEmployee, updateActivityLogAdminController);

export default router;

