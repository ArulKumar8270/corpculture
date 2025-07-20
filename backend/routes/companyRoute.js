import express from "express";
import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";
import {
    createCompany,
    updateCompany,
    getCompanyById,
    deleteCompany,
    getAllCompanies,
    getCompanyByUser
} from "../controllers/company/companyController.js";

const router = express.Router();

// Create company request
router.post("/create", requireSignIn, createCompany);

// Get all companys
router.get("/all", isAdmin, getAllCompanies);

// Get single company
router.get("/get/:id", requireSignIn, getCompanyById);

// GET user's company details (Protected route)
router.get('/user-company/:id', requireSignIn, getCompanyByUser); 

// Update company
router.put("/update/:id", requireSignIn, isAdmin, updateCompany);

// Delete company
router.delete("/delete/:id", requireSignIn, isAdmin, deleteCompany);

export default router;