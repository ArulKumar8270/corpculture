import express from "express";
import {
    createPermission,
    getAllPermissions,
    getPermissionByKey,
    updatePermission,
    deletePermission,
    updatePermissionsBatch, // Import the new function
    getPermissionsByUserId,
} from "../controllers/permission/permissionController.js";
// You might want to add authentication/authorization middleware here, e.g., isAdmin, requireSignIn
// import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new permission entry
router.post("/", createPermission); // Consider adding isAdmin middleware here

// Get all permission entries
router.get("/", getAllPermissions);

// Get a single permission entry by key
router.get("/:key", getPermissionByKey);

// Update a permission entry by key
// router.put("/:key", updatePermission); // Consider adding isAdmin middleware here

// Delete a permission entry by key
router.delete("/:key", deletePermission); // Consider adding isAdmin middleware here

// New route for batch updating permissions
router.put("/batch-update", updatePermissionsBatch); // This endpoint should definitely be protected, e.g., by isAdmin middleware
router.get("/user/:userId", getPermissionsByUserId);
export default router;