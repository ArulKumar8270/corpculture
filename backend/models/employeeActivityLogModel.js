import mongoose from "mongoose";

const employeeActivityLogSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        fromCompany: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: false,
        },
        fromCompanyName: {
            type: String,
            trim: true,
        },
        toCompany: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: false,
        },
        toCompanyName: {
            type: String,
            trim: true,
        },
        km: {
            type: Number,
            min: 0,
        },
        inTime: {
            type: String,
            trim: true,
        },
        outTime: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["PAID", "UNPAID"],
            default: "UNPAID",
        },
        callType: {
            type: String,
            enum: [
                "NEW SERVICE CALLS",
                "PENDING CALLS",
                "REWORK CALLS",
                "DELIVERY CALLS",
                "CHEQUE COLLATION",
                "BILL SIGNATURE",
            ],
            required: false,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        remarks: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("EmployeeActivityLog", employeeActivityLogSchema);

