import express from 'express';
import {
    createRentalPaymentEntry,
    getAllMachines,
    getMachineDetails,
    getSendDetailsToOptions
} from '../controllers/rentalPaymentEntryController.js';
import { isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Rental Payment Entry || POST
router.post('/create-rental-entry', isAdmin, createRentalPaymentEntry);

// Get all machines (for serial number dropdown) || GET
router.get('/machines', isAdmin, getAllMachines);

// Get machine details by ID || GET
router.get('/machine-details/:machineId', isAdmin, getMachineDetails);

// Get send details to options || GET
router.get('/send-details-options', isAdmin, getSendDetailsToOptions);

export default router;