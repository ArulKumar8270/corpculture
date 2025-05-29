const express = require('express');
const { requireSignIn, isAdmin } = require('../middleware/authMiddleware');
const {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router();

// Create Category || POST
router.post('/create', requireSignIn, isAdmin, createCategory);

// Get All Categories || GET
router.get('/all', getAllCategories);

// Get Single Category || GET
router.get('/get/:id', getCategoryById);

// Update Category || PUT
router.put('/update/:id', requireSignIn, isAdmin, updateCategory);

// Delete Category || DELETE
router.delete('/delete/:id', requireSignIn, isAdmin, deleteCategory);

module.exports = router;