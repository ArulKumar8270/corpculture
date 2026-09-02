import express from "express";
import {
    createCommonDetails,
    getCommonDetails,
    updateCommonDetails,
    incrementInvoiceCount,
    incrementReportCount,
} from "../../controllers/commonDetails/commonDetailsController.js";

const router = express.Router();

router.post("/", createCommonDetails);
router.get("/", getCommonDetails);
router.put("/", updateCommonDetails);
router.put("/increment-invoice", incrementInvoiceCount);
router.put("/increment-report", incrementReportCount);

export default router;
