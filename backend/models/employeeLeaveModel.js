import mongoose from "mongoose";

const employeeLeaveSchema = new mongoose.Schema(
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
        leaveType: {
            type: String,
            enum: ["Casual Leave", "Sick Leave", "Earned Leave", "Other"],
            required: true,
        },
        leaveTypeOther: {
            type: String,
            trim: true,
        },
        leaveFrom: {
            type: Date,
            required: true,
        },
        leaveTo: {
            type: Date,
            required: true,
        },
        totalDays: {
            type: Number,
            required: true,
            min: 1,
        },
        reason: {
            type: String,
            trim: true,
            required: true,
        },
        contactDuringLeave: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending",
        },
        managerApproval: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending",
        },
        hrApproval: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending",
        },
        managerRemarks: {
            type: String,
            trim: true,
        },
        hrRemarks: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("EmployeeLeave", employeeLeaveSchema);
