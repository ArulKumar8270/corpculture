import express from "express";
import findProduct from "../../controllers/product/findProduct.js";
import getFilteredProducts from "../../controllers/product/getFilteredProducts.js";
import searchProductController from "../../controllers/product/searchProductController.js";

const router = express.Router();

router.get("/filtered-products", getFilteredProducts);
router.get("/search/:keyword", searchProductController);
router.get("/:id", findProduct);

export default router;
