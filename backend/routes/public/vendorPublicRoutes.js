import express from "express";
import {
    createVendor,
    getAllVendors,
    getVendorById,
    updateVendor,
    deleteVendor,
    restoreVendor,
} from "../../controllers/vendor/vendorController.js";

const router = express.Router();

router.post("/", createVendor);
router.get("/", getAllVendors);
router.post("/restore/:id", restoreVendor);
router.get("/:id", getVendorById);
router.put("/:id", updateVendor);
router.delete("/:id", deleteVendor);

export default router;
