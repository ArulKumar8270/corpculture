import express from "express";
import { isAdminOrEmployee, requireSignIn } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import companyPublicRoutes from "./public/companyPublicRoutes.js";
import { deleteCompany, getAllCompanies } from "../controllers/company/companyController.js";

const router = express.Router();

router.use(companyPublicRoutes);

router.get(
    "/all",
    requireSignIn,
    (req, res, next) => {
        if (Number(req.user?.role) === 3) return next();
        return requirePermission("otherSettingsAllCompany", "view")(req, res, next);
    },
    getAllCompanies
);

router.delete("/delete/:id", isAdminOrEmployee, deleteCompany);

export default router;
