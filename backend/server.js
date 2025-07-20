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
import invoiceRoutes from "./routes/invoiceRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import companyRoutes from "./routes/companyRoute.js";
import employeeRoutes from "./routes/employeeRoute.js";
import commissionRoutes from "./routes/commissionRoutes.js";
import gstRoutes from "./routes/gstRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import serviceProductRoutes from "./routes/serviceProductRoutes.js";
import rentalProductRoutes from "./routes/rentalProductRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js"; // New import
import vendorProductRoutes from "./routes/vendorProductRoutes.js"; // New import
import purchaseRoutes from "./routes/purchaseRoutes.js"; // New import

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//local imports
import connectDB from "./config/database.js";
import authRoute from "./routes/authRoute.js";
import productRoute from "./routes/productRoute.js";
import userRoute from "./routes/userRoute.js";

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
app.use(express.json());
app.use(morgan("dev")); 
// to send large files
app.use(
    fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
    })
);
// use body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, "../client/dist")));
//connect DB
connectDB();

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
app.use("/api/v1/invoice", invoiceRoutes);
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1/company', companyRoutes);
app.use('/api/v1/employee', employeeRoutes);
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

// app.use("*", function (req, res) {
//     res.sendFile(path.join(__dirname, "../client/dist/index.html"));
// });
app.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
