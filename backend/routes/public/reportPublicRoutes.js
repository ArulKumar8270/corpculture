import express from "express";
import {
    createReport,
    getAllReports,
    getReportById,
    updateReport,
    deleteReport,
    restoreReport,
} from "../../controllers/report/reportController.js";

const router = express.Router();

router.post("/", createReport);
router.get("/getByassigned/:assignedTo?/:reportType?", getAllReports);
router.get("/:reportType?", getAllReports);
router.get("/getById/:id", getReportById);
router.post("/restore/:id", restoreReport);
router.put("/:id", updateReport);
router.delete("/:id", deleteReport);

export default router;
