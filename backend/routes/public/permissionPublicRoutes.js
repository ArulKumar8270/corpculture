import express from "express";
import {
    createPermission,
    getAllPermissions,
    getPermissionByKey,
    deletePermission,
    updatePermissionsBatch,
    getPermissionsByUserId,
} from "../../controllers/permission/permissionController.js";

const router = express.Router();

router.post("/", createPermission);
router.get("/", getAllPermissions);
router.get("/user/:userId", getPermissionsByUserId);
router.get("/:key", getPermissionByKey);
router.put("/batch-update", updatePermissionsBatch);
router.delete("/:key", deletePermission);

export default router;
