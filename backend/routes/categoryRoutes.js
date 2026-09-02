import express from "express";
import { isAdminOrEmployee } from "../middleware/authMiddleware.js";
import categoryPublicRoutes from "./public/categoryPublicRoutes.js";
import {
    createCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,
} from "../controllers/category/categoryController.js";

const router = express.Router();

router.use(categoryPublicRoutes);

router.post("/create", isAdminOrEmployee, createCategory);
router.put("/update/:id", isAdminOrEmployee, updateCategory);
router.post("/restore/:id", isAdminOrEmployee, restoreCategory);
router.delete("/delete/:id", isAdminOrEmployee, deleteCategory);

export default router;
