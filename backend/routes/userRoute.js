import express from "express";
import { requireSignIn, isAdmin } from "../middleware/authMiddleware.js";
import getWishlistItems from "../controllers/user/getWishlistItems.js";
import updateWishlist from "../controllers/user/updateWishlist.js";
import getWishlistProducts from "../controllers/user/getWishlistProducts.js";
import createSession from "../controllers/user/createSession.js";
import handleSuccess from "../controllers/user/handleSuccess.js";
import getOrders from "../controllers/user/getOrders.js";
import getOrderDetail from "../controllers/user/getOrderDetail.js";
import getOrdersByEmployeeId from "../controllers/user/getOrdersByEmpId.js";
import getAdminOrders from "../controllers/user/getAdminOrders.js";
import updateOrder from "../controllers/user/updateOrder.js";
import assignOrder from "../controllers/user/assignOrder.js";
import getAllUserOrder from "../controllers/user/getAllUserOrder.js";
import getUsersByCompany from "../controllers/user/getUsersByCompany.js";
import { updateUserPermissions } from "../controllers/user/userController.js";
//router object
const router = express.Router();

//routing
//get Wishlist Items id
router.get("/wishlist", requireSignIn, getWishlistItems);

//update wishlist Items
router.post("/update-wishlist", requireSignIn, updateWishlist);

// get wishlist products
router.get("/wishlist-products", requireSignIn, getWishlistProducts);

// checkout session - stripe payment
router.post("/create-checkout-session", createSession);
router.post("/payment-success", requireSignIn, handleSuccess);
router.get("/byComapny/:id", getUsersByCompany);

// get user orders
router.get("/orders", requireSignIn, getOrders);
router.get("/order-detail", requireSignIn, getOrderDetail);
router.get("/ordersByEmpId/:id", getOrdersByEmployeeId);

//get admin orders
router.get("/admin-orders", requireSignIn, getAdminOrders);
router.get("/admin-order-detail", requireSignIn, getOrderDetail);

//update order status
router.patch("/update/order-status", requireSignIn, updateOrder);
router.patch("/update/aassign-orders", requireSignIn, assignOrder);

//get all order and delete if possible
router.get("/get-all-order", requireSignIn, getAllUserOrder);

// update user permissions
router.patch("/:userId/permissions", requireSignIn, updateUserPermissions);
export default router;
