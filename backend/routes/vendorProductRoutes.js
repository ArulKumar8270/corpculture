import express from "express";
import {
    createVendorProduct,
    getAllVendorProducts,
    getVendorProductById,
    updateVendorProduct,
    deleteVendorProduct,
    getProductsByVendorId,
} from "../controllers/vendorProduct/vendorProductController.js";
// You might want to add authentication/authorization middleware here, e.g., isAdmin, requireSignIn
// import { requireSignIn, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create new Vendor Product
router.post("/", createVendorProduct); // Consider adding isAdmin middleware here

// Get all Vendor Products
router.get("/", getAllVendorProducts);

router.get("/getProductsByVendorId/:vendorId?", getProductsByVendorId);

// Get Vendor Product by ID
router.get("/:id", getVendorProductById);

// Update Vendor Product
router.put("/:id", updateVendorProduct); // Consider adding isAdmin middleware here

// Delete Vendor Product
router.delete("/:id", deleteVendorProduct); // Consider adding isAdmin middleware here

export default router;