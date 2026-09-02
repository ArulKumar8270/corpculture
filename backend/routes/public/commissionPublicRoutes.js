import express from "express";
import {
    createCommission,
    getAllCommissions,
    getCommissionById,
    updateCommission,
    deleteCommission,
    getCommissionsByUser,
} from "../../controllers/commission/commissionController.js";

const router = express.Router();

router.post("/", createCommission);
router.get("/", getAllCommissions);
router.get("/user/:id", getCommissionsByUser);
router.get("/:id", getCommissionById);
router.put("/:id", updateCommission);
router.delete("/:id", deleteCommission);

export default router;
