import express from "express";
import {
    createRentalPaymentEntry,
    getSendDetailsToOptions,
    getAllRentalPaymentEntries,
    getRentalPaymentEntryById,
    updateRentalPaymentEntry,
    getRentalInvoiceAssignedTo,
} from "../../controllers/rental/rentalPaymentEntryController.js";

const router = express.Router();

router.get("/send-details-options", getSendDetailsToOptions);
router.post("/create-rental-entry", createRentalPaymentEntry);
router.post("/all", getAllRentalPaymentEntries);
router.post("/assignedTo/:assignedTo?/:invoiceType?", getRentalInvoiceAssignedTo);
router.get("/:id", getRentalPaymentEntryById);
router.put("/:id", updateRentalPaymentEntry);

export default router;
