import express from "express";
import { isAdminOrEmployee, requireSignIn } from "../middleware/authMiddleware.js";
import servicePublicRoutes from "./public/servicePublicRoutes.js";
import {
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
} from "../controllers/service/serviceController.js";
import autoAssignServiceEnquiries from "../controllers/enquiry/autoAssignServiceEnquiries.js";

const router = express.Router();

router.use(servicePublicRoutes);

router.get("/all", isAdminOrEmployee, getAllServices);
router.get("/get/:id", requireSignIn, getServiceById);
router.put("/update/:id", isAdminOrEmployee, updateService);
router.patch("/auto-assign", isAdminOrEmployee, autoAssignServiceEnquiries);
router.delete("/delete/:id", isAdminOrEmployee, deleteService);

export default router;
