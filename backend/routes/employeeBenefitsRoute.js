import express from "express";
import {
    createEmployeeBenefit,
    getAllEmployeeBenefits,
    getEmployeeBenefitById,
    updateEmployeeBenefit,
    deleteEmployeeBenefit,
    getMyEmployeeBenefits,
} from "../controllers/employee/employeeBenefitsController.js";
import { requireSignIn, isAdminOrEmployee } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", isAdminOrEmployee, createEmployeeBenefit);
router.get("/", isAdminOrEmployee, getAllEmployeeBenefits);
router.get("/my", requireSignIn, getMyEmployeeBenefits);
router.get("/:id", isAdminOrEmployee, getEmployeeBenefitById);
router.put("/:id", isAdminOrEmployee, updateEmployeeBenefit);
router.delete("/:id", isAdminOrEmployee, deleteEmployeeBenefit);

export default router;