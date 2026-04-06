import express from "express";
import { isAdmin, requireSignIn, isAdminOrEmployee } from "../middleware/authMiddleware.js";
import {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
    getServiceByPhone,
    getServiceByType,
    getServiceAssignedTo
} from "../controllers/service/serviceController.js";

const router = express.Router();

// Create service request
router.post("/create", createService);

// Get all services
router.get("/all", isAdminOrEmployee, getAllServices);

// Get single service
router.get("/get/:id", requireSignIn, getServiceById);

// Get type service
router.get("/serviceType/:serviceType", getServiceByType);

// Update service (e.g. mark enquiry completed after invoice — employees need this)
router.put("/update/:id", isAdminOrEmployee, updateService);

// Delete service
router.delete("/delete/:id", isAdminOrEmployee, deleteService);

// GET Service by Phone (example: maybe protected)
router.get('/phone/:phone', getServiceByPhone); // Add appropriate middleware

// GET Service by Phone (example: maybe protected)
router.get('/assignedTo/:assignedTo', getServiceAssignedTo); // Add appropriate middleware

export default router;