import express from "express";
import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";
import {
    createrRental,
    getAllRental,
    getRentalById,
    updateRental,
    deleteRental,
    getRentalByPhone,
    getRentalByType,
    getRentalAssignedTo
} from "../controllers/rental/rentalController.js";

const router = express.Router();

// Create service request
router.post("/create", createrRental);

// Get all services
router.get("/all", isAdmin, getAllRental);

// Get single service
router.get("/get/:id", requireSignIn, getRentalById);

// Get type service
router.get("/serviceType/:serviceType", getRentalByType);

// Get single service invoice
router.get("/assignedTo/:assignedTo", getRentalAssignedTo);

// Update service
router.put("/update/:id", isAdmin, updateRental);

// Delete service
router.delete("/delete/:id", isAdmin, updateRental);

// GET Service by Phone (example: maybe protected)
router.get('/phone/:phone', getRentalByType); // Add appropriate middleware

export default router;