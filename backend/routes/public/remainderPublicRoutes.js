import express from "express";
import {
    createRemainder,
    getAllRemainders,
    getRemainderById,
    getRemaindersByCompany,
    updateRemainder,
    deleteRemainder,
    restoreRemainder,
    getRemaindersByTodayDate,
} from "../../controllers/remainder/remainderController.js";

const router = express.Router();

router.post("/", createRemainder);
router.get("/", getAllRemainders);
router.get("/getByToday/remainder", getRemaindersByTodayDate);
router.post("/getByToday/remainder", getRemaindersByTodayDate);
router.get("/company/:companyId/:type", getRemaindersByCompany);
router.post("/restore/:id", restoreRemainder);
router.get("/:id", getRemainderById);
router.put("/:id", updateRemainder);
router.delete("/:id", deleteRemainder);

export default router;
