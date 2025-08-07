import express from "express";
import {
    createRentalProduct,
    getAllRentalProducts,
    getRentalProductById,
    updateRentalProduct,
    deleteRentalProduct,
    getRentalProductsByCompany
} from "../controllers/rentalProduct/rentalProductController.js";
// You might want to add authentication/authorization middleware here, e.g., isAdmin, requireSignIn
// import { requireSignIn, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create new Rental Product
router.post("/", createRentalProduct); // Consider adding isAdmin middleware here

// Get all Rental Products
router.get("/", getAllRentalProducts);

// Get Rental Product by ID
router.get("/:id", getRentalProductById);
router.get("/getServiceProductsByCompany/:companyId", getRentalProductsByCompany);

// Update Rental Product
router.put("/:id", updateRentalProduct); // Consider adding isAdmin middleware here

// Delete Rental Product
router.delete("/:id", deleteRentalProduct); // Consider adding isAdmin middleware here

export default router;