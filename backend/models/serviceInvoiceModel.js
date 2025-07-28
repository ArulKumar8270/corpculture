import mongoose from "mongoose";

const serviceInvoiceSchema = new mongoose.Schema({
    invoiceNumber: {
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
}, { timestamps: true });

export default mongoose.model('ServiceInvoice', serviceInvoiceSchema);