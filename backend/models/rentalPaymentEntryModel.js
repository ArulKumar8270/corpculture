import mongoose from "mongoose";
import { normalizeSendDetailsTo } from "../utils/normalizeSendDetailsTo.js";

const configSchema = new mongoose.Schema({
    bwOldCount: { type: Number, default: 0 },
    bwNewCount: { type: Number, default: 0 },
    colorOldCount: { type: Number, default: 0 },
    colorNewCount: { type: Number, default: 0 },
    colorScanningOldCount: { type: Number, default: 0 },
    colorScanningNewCount: { type: Number, default: 0 },
}, { _id: false });

// Schema for individual product entry in the products array
const productEntrySchema = new mongoose.Schema({
    basePrice: {
        type: Number,
        default: 0,
    },
    machineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RentalProduct',
        required: true,
    },
    serialNo: {
        type: String,
        trim: true,
    },
    a3Config: {
        type: configSchema,
        default: () => ({}),
    },
    a4Config: {
        type: configSchema,
        default: () => ({}),
    },
    a5Config: {
        type: configSchema,
        default: () => ({}),
    },
    countImageUpload: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    productTotal: {
        type: Number,
        default: 0,
    },
}, { _id: true });

const rentalPaymentEntrySchema = new mongoose.Schema({
    rentalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rental',
        required: true,
    },
    invoiceNumber: {
        type: String,
        trim: true,
    },
    machineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RentalProduct',
        required: false, // Made optional to support products array
    },
    // Array of products - supports multiple products in single entry
    products: {
        type: [productEntrySchema],
        default: [],
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    // Stored as BSON array of strings; Mixed accepts legacy single string until re-saved
    sendDetailsTo: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    countImageUpload: {
        public_id: {
            type: String,
            required: false, // Made optional as each product can have its own image
        },
        url: {
            type: String,
            required: false,
        },
    },
    remarks: {
        type: String,
        trim: true,
    },
    a3Config: {
        type: configSchema,
        default: () => ({}),
    },
    a4Config: {
        type: configSchema,
        default: () => ({}),
    },
    a5Config: {
        type: configSchema,
        default: () => ({}),
    },
    entryDate: {
        type: Date,
        default: Date.now,
    },
    invoiceDate: {
        type: Date,
    },
    modeOfPayment: {
        type: String,
        trim: true,
    },
    bankName: {
        type: String,
        trim: true,
    },
    transactionDetails: {
        type: String,
        trim: true,
    },
    chequeDate: {
        type: Date,
    },
    pendingAmount: {
        type: Number,
        trim: true,
    },
    tdsAmount: {
        type: Number,
        trim: true,
    },
    paymentAmountType: {
        type: String,
        trim: true,
    },
    paymentAmount : {
        type: String,
        trim: true
    },
    transferDate: {
        type: Date,
    },
    companyNamePayment: {
        type: String,
        trim: true,
    },
    paymentContactEmail: {
        type: String,
        trim: true,
    },
    paymentContactEmails: {
        type: [String],
        default: [],
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    invoiceType: {
        type: String,
        trim: true,
    },
    invoiceLink: {
        type: [String],
        trim: true,
    },
    invoiceSendStatus: {
        type: String,
        enum: ["NotSent", "Sent"],
        default: "NotSent",
    },
    invoiceSentAt: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['draft', 'Cancelled', "Pending", "Progress", "Completed", "InvoiceSent", "Paid", "Unpaid"],
        default: 'Unpaid',
    },
    otherPaymentMode: {
        type: String,
        trim: true,
    },
    grandTotal: {
        type: Number,
        trim: true,
    },
}, { timestamps: true });

function coerceSendDetailsToOnDoc(doc) {
    if (doc == null || doc.sendDetailsTo === undefined) return;
    doc.sendDetailsTo = normalizeSendDetailsTo(doc.sendDetailsTo);
}

rentalPaymentEntrySchema.pre("save", function (next) {
    const n = normalizeSendDetailsTo(this.sendDetailsTo);
    if (n.length === 0) {
        return next(new Error("sendDetailsTo must include at least one recipient"));
    }
    this.sendDetailsTo = n;
    next();
});

rentalPaymentEntrySchema.post("find", function (docs) {
    if (!Array.isArray(docs)) return;
    for (const d of docs) coerceSendDetailsToOnDoc(d);
});

rentalPaymentEntrySchema.post("findOne", function (doc) {
    coerceSendDetailsToOnDoc(doc);
});

// Check if the model already exists before defining it
export default mongoose.models.RentalPaymentEntry || mongoose.model('RentalPaymentEntry', rentalPaymentEntrySchema);