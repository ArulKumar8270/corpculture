import express from "express";
import {
    createReport,
    getAllReports,
    getReportById,
    updateReport,
    deleteReport,
} from "../controllers/report/reportController.js";
// You might want to add authentication/authorization middleware here, e.g., isAdmin, requireSignIn
// import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create new Report
router.post("/", createReport); // Consider adding isAdmin middleware here

// Get all Reports
router.get("/getByassigned/:assignedTo?/:reportType?", getAllReports);

router.get("/:reportType?", getAllReports);

// Get Report by ID
router.get("/getById/:id", getReportById);

// Update Report
router.put("/:id", updateReport); // Consider adding isAdmin middleware here

// Delete Report
router.delete("/:id", deleteReport); // Consider adding isAdmin middleware here

export default router;