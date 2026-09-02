import express from "express";
import { requireSignIn, isAdmin, isAdminOrEmployee } from "../middleware/authMiddleware.js";
import {
    createLeaveController,
    getMyLeavesController,
    getLeaveByIdController,
    updateLeaveController,
    deleteLeaveController,
    restoreLeaveController,
    getAllLeavesController,
    updateLeaveStatusAdminController,
} from "../controllers/employee/leaveController.js";

const router = express.Router();

// Admin routes (must be before /:id)
router.get("/admin/all", isAdminOrEmployee, getAllLeavesController);
router.put("/admin/status/:id", isAdminOrEmployee, updateLeaveStatusAdminController);
router.post("/admin/restore/:id", isAdminOrEmployee, restoreLeaveController);

// Employee routes
router.post("/create", requireSignIn, createLeaveController);
router.get("/my-leaves", requireSignIn, getMyLeavesController);
router.post("/restore/:id", requireSignIn, restoreLeaveController);
router.get("/:id", requireSignIn, getLeaveByIdController);
router.put("/update/:id", requireSignIn, updateLeaveController);
router.delete("/delete/:id", requireSignIn, deleteLeaveController);

export default router;
