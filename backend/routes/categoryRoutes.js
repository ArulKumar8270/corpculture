import express from "express";
import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from '../controllers/category/categoryController.js';

const router = express.Router();

// Create Category || POST
router.post('/create', isAdmin, createCategory);

// Get All Categories || GET
router.get('/all', getAllCategories);

// Get Single Category || GET
router.get('/get/:id', getCategoryById);

// Update Category || PUT
router.put('/update/:id', isAdmin, updateCategory);

// Delete Category || DELETE
router.delete('/delete/:id', isAdmin, deleteCategory);

export default router;