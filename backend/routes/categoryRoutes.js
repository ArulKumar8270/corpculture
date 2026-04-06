import express from "express";
import { isAdmin, isAdminOrEmployee } from "../middleware/authMiddleware.js";
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from '../controllers/category/categoryController.js';

const router = express.Router();

// Create Category || POST
router.post('/create', isAdminOrEmployee, createCategory);

// Get All Categories || GET
router.get('/all', getAllCategories);

// Get Single Category || GET
router.get('/get/:id', getCategoryById);

// Update Category || PUT
router.put('/update/:id', isAdminOrEmployee, updateCategory);

// Delete Category || DELETE
router.delete('/delete/:id', isAdminOrEmployee, deleteCategory);

export default router;