/**
 * Public API routes (no JWT required).
 * Mounted at /api/v1/public/* and also included on legacy paths via each domain router.
 */
import express from "express";
import authPublicRoutes from "./authPublicRoutes.js";
import productPublicRoutes from "./productPublicRoutes.js";
import categoryPublicRoutes from "./categoryPublicRoutes.js";
import companyPublicRoutes from "./companyPublicRoutes.js";
import servicePublicRoutes from "./servicePublicRoutes.js";
import rentalPublicRoutes from "./rentalPublicRoutes.js";
import serviceInvoicePublicRoutes from "./serviceInvoicePublicRoutes.js";
import serviceQuotationPublicRoutes from "./serviceQuotationPublicRoutes.js";
import rentalPaymentPublicRoutes from "./rentalPaymentPublicRoutes.js";
import reportPublicRoutes from "./reportPublicRoutes.js";
import remainderPublicRoutes from "./remainderPublicRoutes.js";
import commissionPublicRoutes from "./commissionPublicRoutes.js";
import employeePublicRoutes from "./employeePublicRoutes.js";
import employeeBenefitsPublicRoutes from "./employeeBenefitsPublicRoutes.js";
import userPublicRoutes from "./userPublicRoutes.js";
import materialPublicRoutes from "./materialPublicRoutes.js";
import gstPublicRoutes from "./gstPublicRoutes.js";
import vendorPublicRoutes from "./vendorPublicRoutes.js";
import vendorProductPublicRoutes from "./vendorProductPublicRoutes.js";
import serviceProductPublicRoutes from "./serviceProductPublicRoutes.js";
import rentalProductPublicRoutes from "./rentalProductPublicRoutes.js";
import purchasePublicRoutes from "./purchasePublicRoutes.js";
import permissionPublicRoutes from "./permissionPublicRoutes.js";
import commonDetailsPublicRoutes from "./commonDetailsPublicRoutes.js";
import oldInvoicePublicRoutes from "./oldInvoicePublicRoutes.js";
import frontHomeSettingsPublicRoutes from "./frontHomeSettingsPublicRoutes.js";

const router = express.Router();

router.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "CorpCulture public API",
        note: "Legacy URLs under /api/v1/* remain supported.",
    });
});

router.use("/auth", authPublicRoutes);
router.use("/product", productPublicRoutes);
router.use("/category", categoryPublicRoutes);
router.use("/company", companyPublicRoutes);
router.use("/service", servicePublicRoutes);
router.use("/rental", rentalPublicRoutes);
router.use("/service-invoice", serviceInvoicePublicRoutes);
router.use("/service-quotation", serviceQuotationPublicRoutes);
router.use("/rental-payment", rentalPaymentPublicRoutes);
router.use("/report", reportPublicRoutes);
router.use("/remainders", remainderPublicRoutes);
router.use("/commissions", commissionPublicRoutes);
router.use("/employee", employeePublicRoutes);
router.use("/employee-benefits", employeeBenefitsPublicRoutes);
router.use("/user", userPublicRoutes);
router.use("/materials", materialPublicRoutes);
router.use("/gst", gstPublicRoutes);
router.use("/vendors", vendorPublicRoutes);
router.use("/vendor-products", vendorProductPublicRoutes);
router.use("/service-products", serviceProductPublicRoutes);
router.use("/rental-products", rentalProductPublicRoutes);
router.use("/purchases", purchasePublicRoutes);
router.use("/permissions", permissionPublicRoutes);
router.use("/common-details", commonDetailsPublicRoutes);
router.use("/old-invoice", oldInvoicePublicRoutes);
router.use("/front-home-settings", frontHomeSettingsPublicRoutes);

export default router;
