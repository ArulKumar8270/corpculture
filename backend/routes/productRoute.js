import express from "express";
import { isAdminOrEmployee } from "../middleware/authMiddleware.js";
import productPublicRoutes from "./public/productPublicRoutes.js";
import newProduct from "../controllers/product/newProduct.js";
import getSellerProducts from "../controllers/product/getSellerProducts.js";
import deleteProduct from "../controllers/product/deleteProduct.js";
import updateProduct from "../controllers/product/updateProduct.js";

const router = express.Router();

router.use(productPublicRoutes);

router.post("/new-product", isAdminOrEmployee, newProduct);
router.get("/seller-product", isAdminOrEmployee, getSellerProducts);
router.post("/delete-product", isAdminOrEmployee, deleteProduct);
router.patch("/update/:id", isAdminOrEmployee, updateProduct);

export default router;
