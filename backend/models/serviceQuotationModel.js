import mongoose from "mongoose";

const serviceQuotationSchema = new mongoose.Schema({
    quotationNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company', // Reference to the Company model
        required: true,
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ServiceProduct', // Reference to the ServiceProduct model
                required: true,
            },
            productName: { // Storing name for quick access, can be populated from productId
                type: String,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            rate: { // Price per unit of the product
                type: Number,
                required: true,
                min: 0,
            },
            totalAmount: { // quantity * rate for this specific product line item
                type: Number,
                required: true,
                min: 0,
            },
        },
    ],
    modeOfPayment: {
        type: String,
        required: true,
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
    otherPaymentMode: { // New field for 'OTHERS' payment mode
        type: String,
        trim: true,
    },
    deliveryAddress: {
        type: String,
        required: true,
        trim: true,
    },
    reference: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    subtotal: { // Sum of all product totalAmounts
        type: Number,
        required: true,
        min: 0,
    },
    tax: { // Optional tax amount
        type: Number,
        default: 0,
        min: 0,
    },
    grandTotal: { // subtotal + tax
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ['draft', 'InvoiceSent', 'Cancelled', "Unpaid", "Paid", "Pending", "TDS"],
        default: 'draft',
    },
    invoiceDate: {
        type: Date,
        default: Date.now,
    },
    assignedTo: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

export default mongoose.model('ServiceQuotation', serviceQuotationSchema);