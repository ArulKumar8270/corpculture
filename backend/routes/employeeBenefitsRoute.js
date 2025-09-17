import express from "express";
import {
    createEmployeeBenefit,
    getAllEmployeeBenefits,
    getEmployeeBenefitById,
    updateEmployeeBenefit,
    deleteEmployeeBenefit,
} from "../controllers/employee/employeeBenefitsController.js";

const router = express.Router();

router.post("/", createEmployeeBenefit);
router.get("/", getAllEmployeeBenefits);
router.get("/:id", getEmployeeBenefitById);
router.put("/:id", updateEmployeeBenefit);
router.delete("/:id", deleteEmployeeBenefit);

export default router;