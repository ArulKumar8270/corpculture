import express from "express";
import { requireSignIn, isAdmin } from "../middleware/authMiddleware.js";
import {
    paymentRateLimiter,
    orderCreateRateLimiter,
} from "../middleware/rateLimitMiddleware.js";
import userPublicRoutes from "./public/userPublicRoutes.js";
import getWishlistItems from "../controllers/user/getWishlistItems.js";
import updateWishlist from "../controllers/user/updateWishlist.js";
import getWishlistProducts from "../controllers/user/getWishlistProducts.js";
import createSession from "../controllers/user/createSession.js";
import handleSuccess from "../controllers/user/handleSuccess.js";
import createOrderWithoutPayment from "../controllers/user/createOrderWithoutPayment.js";
import {
    initiateHdfcPayment,
    verifyHdfcPayment,
    refundHdfcPayment,
} from "../controllers/user/hdfcPaymentController.js";
import getOrders from "../controllers/user/getOrders.js";
import getOrderDetail from "../controllers/user/getOrderDetail.js";
import getAdminOrders from "../controllers/user/getAdminOrders.js";
import updateOrder from "../controllers/user/updateOrder.js";
import assignOrder from "../controllers/user/assignOrder.js";
import autoAssignOrders, { suggestEmployeesForOrder } from "../controllers/user/autoAssignOrders.js";
import getAllUserOrder from "../controllers/user/getAllUserOrder.js";
import { updateUserPermissions } from "../controllers/user/userController.js";

const router = express.Router();

router.use(userPublicRoutes);

router.get("/wishlist", requireSignIn, getWishlistItems);
router.post("/update-wishlist", requireSignIn, updateWishlist);
router.get("/wishlist-products", requireSignIn, getWishlistProducts);
router.post("/create-checkout-session", requireSignIn, paymentRateLimiter, createSession);
router.post("/payment-success", requireSignIn, paymentRateLimiter, handleSuccess);
router.post("/create-order", requireSignIn, orderCreateRateLimiter, createOrderWithoutPayment);
router.post("/hdfc/session", requireSignIn, paymentRateLimiter, initiateHdfcPayment);
router.post("/hdfc/verify", requireSignIn, paymentRateLimiter, verifyHdfcPayment);
router.get("/hdfc/verify/:orderId", requireSignIn, paymentRateLimiter, verifyHdfcPayment);
router.post("/hdfc/refund", requireSignIn, isAdmin, refundHdfcPayment);
router.get("/orders", requireSignIn, getOrders);
router.get("/order-detail", requireSignIn, getOrderDetail);
router.get("/admin-orders", requireSignIn, getAdminOrders);
router.patch("/update/order-status", requireSignIn, updateOrder);
router.patch("/update/aassign-orders", requireSignIn, assignOrder);
router.patch("/auto-assign-orders", requireSignIn, autoAssignOrders);
router.get("/order/:id/suggest-employee", requireSignIn, suggestEmployeesForOrder);
router.get("/get-all-order", requireSignIn, getAllUserOrder);
router.patch("/:userId/permissions", requireSignIn, updateUserPermissions);

export default router;
