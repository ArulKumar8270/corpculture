import mongoose from "mongoose";

const configSchema = new mongoose.Schema({
    bwOldCount: { type: Number, default: 0 },
    bwNewCount: { type: Number, default: 0 },
    colorOldCount: { type: Number, default: 0 },
    colorNewCount: { type: Number, default: 0 },
    colorScanningOldCount: { type: Number, default: 0 },
    colorScanningNewCount: { type: Number, default: 0 },
}, { _id: false });

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
        required: true,
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    sendDetailsTo: {
        type: String,
        required: true,
        trim: true,
    },
    countImageUpload: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
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
    transferDate: {
        type: Date,
    },
    companyNamePayment: {
        type: String,
        trim: true,
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
    status: {
        type: String,
        enum: ['draft', 'Cancelled', "Pending", "Progress", "Completed", "InvoiceSent", "Paid", "Unpaid"],
        default: 'Unpaid',
    },
    otherPaymentMode: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

// Check if the model already exists before defining it
export default mongoose.models.RentalPaymentEntry || mongoose.model('RentalPaymentEntry', rentalPaymentEntrySchema);