import express from "express";
import {
    createServiceProduct,
    getAllServiceProducts,
    getServiceProductById,
    updateServiceProduct,
    deleteServiceProduct,
} from "../controllers/serviceProduct/serviceProductController.js";
// You might want to add authentication/authorization middleware here, e.g., isAdmin, requireSignIn
// import { requireSignIn, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create new Service Product
router.post("/", createServiceProduct); // Consider adding isAdmin middleware here

// Get all Service Products
router.get("/", getAllServiceProducts);

// Get Service Product by ID
router.get("/:id", getServiceProductById);

// Update Service Product
router.put("/:id", updateServiceProduct); // Consider adding isAdmin middleware here

// Delete Service Product
router.delete("/:id", deleteServiceProduct); // Consider adding isAdmin middleware here

export default router;