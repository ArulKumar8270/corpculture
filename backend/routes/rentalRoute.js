import express from "express";
import { isAdminOrEmployee, requireSignIn } from "../middleware/authMiddleware.js";
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
router.get("/all", isAdminOrEmployee, getAllRental);

// Get single service
router.get("/get/:id", requireSignIn, getRentalById);

// Get type service
router.get("/serviceType/:serviceType", getRentalByType);

// Get single service invoice
router.get("/assignedTo/:assignedTo", getRentalAssignedTo);

// Update service
router.put("/update/:id", isAdminOrEmployee, updateRental);

// Delete service
router.delete("/delete/:id", isAdminOrEmployee, updateRental);

// GET Service by Phone (example: maybe protected)
router.get('/phone/:phone', getRentalByType); // Add appropriate middleware

export default router;