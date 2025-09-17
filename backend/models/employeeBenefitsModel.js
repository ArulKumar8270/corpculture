import mongoose from "mongoose";

const employeeBenefitsSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
    },
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceInvoice",
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceProduct",
        required: true,
    },
    quantity: {
        type: Number,
        min: 1,
    },
    reInstall: {
        type: Boolean,
        default: false,
    },
    otherProducts: {
        type: String,
        default: "",
    },
}, { timestamps: true });

export default mongoose.model("EmployeeBenefits", employeeBenefitsSchema);