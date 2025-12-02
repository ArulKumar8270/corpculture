import mongoose from "mongoose";

const oldInvoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerMobile: {
        type: String,
        trim: true
    },
    customerEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    customerAddress: {
        type: String,
        trim: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    total: {
        type: Number,
        required: true,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Unpaid', 'Partial', 'Pending'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        trim: true
    },
    paymentDate: {
        type: Date
    },
    paymentAmount: {
        type: Number,
        default: 0
    },
    dueAmount: {
        type: Number,
        default: 0
    },
    remainderDate: {
        type: Number,
        min: 0
    },
    notes: {
        type: String,
        trim: true
    },
    // Store the original Excel row data for reference
    excelRowIndex: {
        type: Number
    },
    // Flag to indicate if this is imported from Excel
    isImported: {
        type: Boolean,
        default: true
    },
    // Store the uploaded file name for tracking
    uploadedFileName: {
        type: String
    }
}, { 
    timestamps: true 
});

// Index for faster queries
oldInvoiceSchema.index({ invoiceNumber: 1 });
oldInvoiceSchema.index({ date: -1 });
oldInvoiceSchema.index({ customerName: 1 });
oldInvoiceSchema.index({ paymentStatus: 1 });
oldInvoiceSchema.index({ remainderDate: 1 });

export default mongoose.model("OldInvoice", oldInvoiceSchema);

