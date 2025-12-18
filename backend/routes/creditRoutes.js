import express from "express";
import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";
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
router.post("/create", requireSignIn, isAdmin, createCredit);

// Get All Credits || GET
router.get("/all", requireSignIn, isAdmin, getAllCredits);

// Get Credit by ID || GET
router.get("/get/:id", requireSignIn, isAdmin, getCreditById);

// Get Credits by Company ID || GET
router.get("/company/:companyId", requireSignIn, isAdmin, getCreditsByCompany);

// Update Credit || PUT
router.put("/update/:id", requireSignIn, isAdmin, updateCredit);

// Delete Credit || DELETE
router.delete("/delete/:id", requireSignIn, isAdmin, deleteCredit);

export default router;
