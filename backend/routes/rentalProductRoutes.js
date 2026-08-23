import express from "express";
import {
    createRentalProduct,
    getAllRentalProducts,
    getRentalProductById,
    updateRentalProduct,
    deleteRentalProduct,
    getRentalProductsByCompany,
    getTodaysRentalProducts,
    normalizeExistingRentalPaymentDates,
} from "../controllers/rentalProduct/rentalProductController.js";
// You might want to add authentication/authorization middleware here, e.g., isAdmin, requireSignIn
// import { requireSignIn, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create new Rental Product
router.post("/", createRentalProduct); // Consider adding isAdmin middleware here

// Get all Rental Products
router.get("/", getAllRentalProducts);

router.get("/getServiceProductsByCompany/:companyId", getRentalProductsByCompany);

// Get Today's Rental Products
router.get("/payment/today", getTodaysRentalProducts);

// Get Rental Product by ID
router.get("/:id", getRentalProductById);

// Normalize existing payment dates (run once after deploy)
router.post("/normalize-payment-dates", normalizeExistingRentalPaymentDates);

// Update Rental Product
router.put("/:id", updateRentalProduct); // Consider adding isAdmin middleware here

// Delete Rental Product
router.delete("/:id", deleteRentalProduct); // Consider adding isAdmin middleware here

export default router;