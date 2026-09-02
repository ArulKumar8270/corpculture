import express from "express";
import {
    getServiceQuotationById,
    getServiceQuotationAssignedTo,
} from "../../controllers/serviceQuotation/serviceQuotationController.js";

const router = express.Router();

router.get("/get/:id", getServiceQuotationById);
router.get("/assignedTo/:assignedTo", getServiceQuotationAssignedTo);

export default router;
