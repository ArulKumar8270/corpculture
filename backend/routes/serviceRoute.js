import express from "express";
import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";
import {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
    getServiceByPhone,
    getServiceByType
} from "../controllers/service/serviceController.js";

const router = express.Router();

// Create service request
router.post("/create", createService);

// Get all services
router.get("/all", isAdmin, getAllServices);

// Get single service
router.get("/get/:id", requireSignIn, getServiceById);

// Get type service
router.get("/serviceType/:serviceType", getServiceByType);

// Update service
router.put("/update/:id", isAdmin, updateService);

// Delete service
router.delete("/delete/:id", isAdmin, deleteService);

// GET Service by Phone (example: maybe protected)
router.get('/phone/:phone', getServiceByPhone); // Add appropriate middleware

export default router;