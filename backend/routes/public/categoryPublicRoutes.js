import express from "express";
import {
    getAllCategories,
    getCategoryById,
} from "../../controllers/category/categoryController.js";

const router = express.Router();

router.get("/all", getAllCategories);
router.get("/get/:id", getCategoryById);

export default router;
