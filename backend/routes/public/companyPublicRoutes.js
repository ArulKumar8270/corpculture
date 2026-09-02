import express from "express";
import {
    createCompany,
    getCompanyById,
    getCompanyByPhone,
    getCompanyByUser,
    updateCompany,
} from "../../controllers/company/companyController.js";

const router = express.Router();

router.post("/create", createCompany);
router.get("/get/:id", getCompanyById);
router.get("/getByPhone/:phone", getCompanyByPhone);
router.get("/user-company/:id", getCompanyByUser);
router.put("/update/:id", updateCompany);

export default router;
