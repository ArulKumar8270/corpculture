import express from "express";
import { hdfcPaymentReturn } from "../../controllers/user/hdfcPaymentController.js";
import getUsersByCompany from "../../controllers/user/getUsersByCompany.js";
import getOrdersByEmployeeId from "../../controllers/user/getOrdersByEmpId.js";
import getOrderDetail from "../../controllers/user/getOrderDetail.js";

const router = express.Router();

router.get("/hdfc/return", hdfcPaymentReturn);
router.get("/byComapny/:id", getUsersByCompany);
router.get("/ordersByEmpId/:id", getOrdersByEmployeeId);
router.get("/admin-order-detail", getOrderDetail);

export default router;
