import express from "express";
import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";
import {
    createCompany,
    updateCompany,
    getCompanyById,
    deleteCompany,
    getAllCompanies,
    getCompanyByUser,
    getCompanyByPhone
} from "../controllers/company/companyController.js";

const router = express.Router();

// Create company request
router.post("/create", createCompany);

// Get all companys
router.get("/all", isAdmin, getAllCompanies);

// Get single company
router.get("/get/:id", getCompanyById);

router.get("/getByPhone/:phone", getCompanyByPhone);

// GET user's company details (Protected route)
router.get('/user-company/:id', getCompanyByUser); 

// Update company
router.put("/update/:id", isAdmin, updateCompany);

// Delete company
router.delete("/delete/:id", isAdmin, deleteCompany);

export default router;