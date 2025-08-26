import mongoose from "mongoose";

// {{ edit_1 }}
const configSchema = new mongoose.Schema({
    bwOldCount: { type: Number, default: 0 },
    bwNewCount: { type: Number, default: 0 },
    colorOldCount: { type: Number, default: 0 }, // New field
    colorNewCount: { type: Number, default: 0 }, // New field
    colorScanningOldCount: { type: Number, default: 0 }, // New field
    colorScanningNewCount: { type: Number, default: 0 }, // New field
}, { _id: false }); // _id: false to prevent Mongoose from creating _id for subdocuments
// {{ edit_1 }}

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
    machineId: { // Reference to the Machine model for serial number and company
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RentalProduct',
        required: true,
    },
    companyId: { // Storing companyId directly for easier access/populating
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    sendDetailsTo: {
        type: String, // Assuming this is a string for now, could be an enum or ref to another model
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
        default: () => ({}), // Default to an empty object if not provided
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
    bankName: { // New field
        type: String,
        trim: true,
    },
    transactionDetails: { // New field (e.g., Cheque Number, UPI ID, Transaction ID)
        type: String,
        trim: true,
    },
    chequeDate: { // New field for Cheque payment
        type: Date,
    },
    transferDate: { // New field for Bank Transfer/UPI
        type: Date,
    },
    companyNamePayment: { // New field for payment from company
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
        type: [String], // Changed to an array of strings to allow multiple URLs
        trim: true,
    },
    otherPaymentMode: { // New field for 'OTHERS' payment mode
        type: String,
        trim: true,
    },
}, { timestamps: true });

export default mongoose.model('RentalPaymentEntry', rentalPaymentEntrySchema);