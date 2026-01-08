//packages
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import { fileURLToPath } from "url";
import { dirname } from "path";
import serviceRoute from "./routes/serviceRoute.js";
import rentalRoute from "./routes/rentalRoute.js";
import invoiceRoutes from "./routes/invoiceRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import companyRoutes from "./routes/companyRoute.js";
import employeeRoutes from "./routes/employeeRoute.js";
import employeeActivityLogRoutes from "./routes/employeeActivityLogRoute.js";
import commissionRoutes from "./routes/commissionRoutes.js";
import gstRoutes from "./routes/gstRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import serviceProductRoutes from "./routes/serviceProductRoutes.js";
import rentalProductRoutes from "./routes/rentalProductRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js"; // New import
import vendorProductRoutes from "./routes/vendorProductRoutes.js"; // New import
import purchaseRoutes from "./routes/purchaseRoutes.js"; // New import
import serviceInvoiceRoutes from "./routes/serviceInvoiceRoute.js"; // New import
import serviceQuotationRoutes from "./routes/serviceQuotationRoute.js"; // New import
import reportRoutes from "./routes/reportRoutes.js";
import commonDetailsRoutes from "./routes/commonDetailsRoutes.js"; // Import the new routes
import rentalPaymentEntryRoutes from './routes/rentalPaymentEntryRoutes.js'; // Import new routes
import remainderRoutes from "./routes/remainderRoutes.js"; // Import new routes
import employeeBenefitsRoute from "./routes/employeeBenefitsRoute.js";
import materialRoutes from "./routes/materialRoutes.js"; // Import material routes
import oldInvoiceRoutes from "./routes/oldInvoiceRoute.js"; // Import old invoice routes
import creditRoutes from "./routes/creditRoutes.js"; // Import credit routes
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//local imports
import connectDB from "./config/database.js";
import mongoose from "mongoose";
import authRoute from "./routes/authRoute.js";
import productRoute from "./routes/productRoute.js";
import userRoute from "./routes/userRoute.js";
import { dropGstTypeUniqueIndex } from "./models/gstModel.js";

//rest object
const app = express();

//configure env
dotenv.config();

//configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET,
});

//middleware
app.use(cors());
app.use(morgan("dev"));
// to send large files
app.use(
    fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
    })
);
// use body-parser
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// app.use(express.static(path.join(__dirname, "../client/dist")));
//connect DB
connectDB();

// Drop unique index on gstType to allow duplicates once DB is connected
mongoose.connection.once('connected', async () => {
    await dropGstTypeUniqueIndex();
});

//port
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
    res.send("Hello there!");
});

//routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/service", serviceRoute);
app.use("/api/v1/rental", rentalRoute);
app.use("/api/v1/invoice", invoiceRoutes);
app.use("/api/v1/old-invoice", oldInvoiceRoutes); // Old invoice routes
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1/company', companyRoutes);
app.use('/api/v1/employee', employeeRoutes);
app.use('/api/v1/employee-activity-log', employeeActivityLogRoutes);
app.use("/api/v1/commissions", commissionRoutes);
app.use("/api/v1/gst", gstRoutes);
app.use("/api/v1/service-products", serviceProductRoutes);
app.use("/api/v1/permissions", permissionRoutes);
// Rental Product routes
app.use("/api/v1/rental-products", rentalProductRoutes);

// Vendor routes
app.use("/api/v1/vendors", vendorRoutes); // New route registration

// Vendor Product routes
app.use("/api/v1/vendor-products", vendorProductRoutes); // New route registration

// Purchase routes
app.use("/api/v1/purchases", purchaseRoutes); // New route registration
// Service Invoice routes
app.use("/api/v1/service-invoice", serviceInvoiceRoutes);
// Service Quotation routes
app.use("/api/v1/service-quotation", serviceQuotationRoutes);
// app.use("*", function (req, res) {
//     res.sendFile(path.join(__dirname, "../client/dist/index.html"));
// });
app.use('/api/v1/rental-payment', rentalPaymentEntryRoutes); // Use new routes

app.use("/api/v1/report", reportRoutes); // Or choose your desired base path
app.use("/api/v1/common-details", commonDetailsRoutes); // Add the new common details routes
app.use("/api/v1/remainders", remainderRoutes);
app.use("/api/v1/employee-benefits", employeeBenefitsRoute);
app.use("/api/v1/materials", materialRoutes); // Material routes
app.use("/api/v1/credit", creditRoutes); // Credit routes

app.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
