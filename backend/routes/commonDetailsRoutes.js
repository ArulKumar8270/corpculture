import express from "express";
import {
    createCommonDetails,
    getCommonDetails,
    updateCommonDetails,
    incrementInvoiceCount,
    incrementReportCount
} from "../controllers/commonDetails/commonDetailsController.js";
// You might want to add authentication/authorization middleware here, e.g., isAdmin, requireSignIn
// import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create common details (intended for initial setup)
router.post("/", createCommonDetails);

// Get common details
router.get("/", getCommonDetails);

// Update common details (e.g., set both counts)
router.put("/", updateCommonDetails);

// Increment invoice count
router.put("/increment-invoice", incrementInvoiceCount);

// Increment report count
router.put("/increment-report", incrementReportCount);

export default router;