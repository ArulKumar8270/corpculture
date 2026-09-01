import express from 'express';
import {
    createRentalPaymentEntry,
    getSendDetailsToOptions,
    getAllRentalPaymentEntries,
    getRentalPaymentEntryById,
    updateRentalPaymentEntry,
    getRentalInvoiceAssignedTo,
} from '../controllers/rental/rentalPaymentEntryController.js';
import { isAdminOrEmployee } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(isAdminOrEmployee);

// Get send details to options || GET (before /:id)
router.get('/send-details-options', getSendDetailsToOptions);

// Create Rental Payment Entry || POST
router.post('/create-rental-entry', createRentalPaymentEntry);

// Get all Rental Payment Entries || POST
router.post('/all', getAllRentalPaymentEntries);

// Get single Rental invoice
router.post("/assignedTo/:assignedTo?/:invoiceType?", getRentalInvoiceAssignedTo);

// Get single Rental Payment Entry by ID || GET
router.get('/:id', getRentalPaymentEntryById);

// Update Rental Payment Entry || PUT
router.put('/:id', updateRentalPaymentEntry);

export default router;
