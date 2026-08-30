import mongoose from "mongoose";

const hdfcPaymentSessionSchema = new mongoose.Schema(
    {
        hdfcOrderId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        buyer: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        hdfcCustomerId: {
            type: String,
            required: true,
        },
        orderItems: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        shippingInfo: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        orderReferenceNo: {
            type: String,
            required: true,
            trim: true,
        },
        companyId: {
            type: mongoose.Schema.ObjectId,
            ref: "Company",
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending",
        },
        hdfcStatus: {
            type: String,
            default: "NEW",
        },
        paymentLinks: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        createdOrderId: {
            type: mongoose.Schema.ObjectId,
            ref: "Orders",
        },
        refunds: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },
        frontendOrigin: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("HdfcPaymentSession", hdfcPaymentSessionSchema);
