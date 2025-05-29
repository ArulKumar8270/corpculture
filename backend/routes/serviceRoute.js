import express from "express";
import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";
import {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService
} from "../controllers/service/serviceController.js";

const router = express.Router();

// Create service request
router.post("/create", requireSignIn, createService);

// Get all services
router.get("/all", requireSignIn, isAdmin, getAllServices);

// Get single service
router.get("/get/:id", requireSignIn, getServiceById);

// Update service
router.put("/update/:id", requireSignIn, isAdmin, updateService);

// Delete service
router.delete("/delete/:id", requireSignIn, isAdmin, deleteService);

export default router;