import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },
        // Employee snapshot (for display/PDF)
        employeeName: { type: String, required: true },
        employeeIdNo: { type: String, default: "" },
        designation: { type: String, default: "" },
        dateOfJoining: { type: Date },
        payPeriod: { type: String, required: true },
        payDate: { type: Date, required: true },
        paidDays: { type: Number, default: 0 },
        lopDays: { type: Number, default: 0 },
        // Earnings (amount & optional YTD)
        earnings: {
            basic: { type: Number, default: 0 },
            petrolAllowance: { type: Number, default: 0 },
            bikeAllowance: { type: Number, default: 0 },
            byBenefit: { type: Number, default: 0 },
            foodAllowance: { type: Number, default: 0 },
            incentives: { type: Number, default: 0 },
        },
        // Deductions
        deductions: {
            taxPayable: { type: Number, default: 0 },
        },
        // Star/rating metrics (0-5 or value)
        ratings: {
            timing: { type: Number, default: 0 },
            leave: { type: Number, default: 0 },
            workFb: { type: Number, default: 0 },
            incentive: { type: Number, default: 0 },
            firmFb: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// Virtuals for computed values
payslipSchema.virtual("grossEarnings").get(function () {
    const e = this.earnings || {};
    return (e.basic || 0) + (e.petrolAllowance || 0) + (e.bikeAllowance || 0) + (e.byBenefit || 0) + (e.foodAllowance || 0) + (e.incentives || 0);
});

payslipSchema.virtual("totalDeductions").get(function () {
    const d = this.deductions || {};
    return d.taxPayable || 0;
});

payslipSchema.virtual("netPay").get(function () {
    return this.grossEarnings - this.totalDeductions;
});

payslipSchema.set("toJSON", { virtuals: true });
payslipSchema.set("toObject", { virtuals: true });

export default mongoose.model("Payslip", payslipSchema);
