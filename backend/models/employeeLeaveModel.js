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
        companyName: {
            type: String,
            trim: true,
        },
        /** Employee must accept all special declarations before submit. */
        declarationAccepted: {
            type: Boolean,
            default: false,
        },
        /** Typed name as employee signature (Section 5). */
        employeeSignatureName: {
            type: String,
            trim: true,
        },
        employeeSignDate: {
            type: Date,
        },
        /** Section 6 — office use (optional; admin may fill). */
        reportingManagerName: {
            type: String,
            trim: true,
        },
        reportingManagerSignDate: {
            type: Date,
        },
        hrApproverName: {
            type: String,
            trim: true,
        },
        hrApproverSignDate: {
            type: Date,
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
