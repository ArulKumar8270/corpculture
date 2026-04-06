import express from "express";
import { requireSignIn, isAdmin, isAdminOrEmployee } from "../middleware/authMiddleware.js";
import newProduct from "../controllers/product/newProduct.js";
import getSellerProducts from "../controllers/product/getSellerProducts.js";
import deleteProduct from "../controllers/product/deleteProduct.js";
import findProduct from "../controllers/product/findProduct.js";
import updateProduct from "../controllers/product/updateProduct.js";
import getFilteredProducts from "../controllers/product/getFilteredProducts.js";
import searchProductController from "../controllers/product/searchProductController.js";

//router object
const router = express.Router();

//Add new product POST
router.post("/new-product", isAdminOrEmployee, newProduct);

//Get Seller Product
router.get("/seller-product", isAdminOrEmployee, getSellerProducts);

//Delete Product
router.post("/delete-product", isAdminOrEmployee, deleteProduct);

//find filtered product
router.get("/filtered-products", getFilteredProducts);

//find product details from product id
router.get("/:id", findProduct);

//update product details from product id
router.patch("/update/:id", isAdminOrEmployee, updateProduct);

// search products using keyword
router.get("/search/:keyword", searchProductController);

export default router;
