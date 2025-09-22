import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
    vendorCompanyName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor', // Reference to the Vendor model
        required: true,
    },
    productName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VendorProduct', // Reference to the Product model
        required: true,
        trim: true,
    },
    voucherType: {
        type: String,
        required: true,
        trim: true,
    },
    purchaseInvoiceNumber: {
        type: String,
        required: true,
        unique: true, // Invoice number should be unique
        trim: true,
    },
    narration: {
        type: String,
        trim: true,
    },
    purchaseDate: {
        type: Date,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    rate: {
        type: Number,
        required: true,
        min: 0,
    },
    freightCharges: {
        type: Number,
        default: 0,
        min: 0,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    grossTotal: {
        type: Number,
        required: true,
        min: 0,
    },
    roundOff: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

export default mongoose.model('Purchase', purchaseSchema);