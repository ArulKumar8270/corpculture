import express from "express";
import { isAdmin, isAdminOrEmployee, requireSignIn } from "../middleware/authMiddleware.js";
import {
    createCredit,
    getAllCredits,
    getCreditById,
    getCreditsByCompany,
    updateCredit,
    deleteCredit
} from "../controllers/credit/creditController.js";

const router = express.Router();

// Create Credit || POST
router.post("/create", requireSignIn, isAdminOrEmployee, createCredit);

// Get All Credits || GET
router.get("/all", requireSignIn, isAdminOrEmployee, getAllCredits);

// Get Credit by ID || GET
router.get("/get/:id", requireSignIn, isAdminOrEmployee, getCreditById);

// Get Credits by Company ID || GET
router.get("/company/:companyId", requireSignIn, isAdminOrEmployee, getCreditsByCompany);

// Update Credit || PUT
router.put("/update/:id", requireSignIn, isAdminOrEmployee, updateCredit);

// Delete Credit || DELETE
router.delete("/delete/:id", requireSignIn, isAdminOrEmployee, deleteCredit);

export default router;
