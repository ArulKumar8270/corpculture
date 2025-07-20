import express from "express";
import {
    createPurchase,
    getAllPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase,
} from "../controllers/purchase/purchaseController.js";
// You might want to add authentication/authorization middleware here, e.g., isAdmin, requireSignIn
// import { requireSignIn, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create new Purchase
router.post("/", createPurchase); // Consider adding isAdmin middleware here

// Get all Purchases
router.get("/", getAllPurchases);

// Get Purchase by ID
router.get("/:id", getPurchaseById);

// Update Purchase
router.put("/:id", updatePurchase); // Consider adding isAdmin middleware here

// Delete Purchase
router.delete("/:id", deletePurchase); // Consider adding isAdmin middleware here

export default router;