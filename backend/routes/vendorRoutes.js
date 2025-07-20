import express from "express";
import {
    createVendor,
    getAllVendors,
    getVendorById,
    updateVendor,
    deleteVendor,
} from "../controllers/vendor/vendorController.js";
// You might want to add authentication/authorization middleware here, e.g., isAdmin, requireSignIn
// import { requireSignIn, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create new Vendor
router.post("/", createVendor); // Consider adding isAdmin middleware here

// Get all Vendors
router.get("/", getAllVendors);

// Get Vendor by ID
router.get("/:id", getVendorById);

// Update Vendor
router.put("/:id", updateVendor); // Consider adding isAdmin middleware here

// Delete Vendor
router.delete("/:id", deleteVendor); // Consider adding isAdmin middleware here

export default router;