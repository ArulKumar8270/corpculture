import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
    vendorCompanyName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor', // Reference to the Vendor model
        required: true,
    },
    productName: {
        type: String,
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
    gstinUn: {
        type: String,
        trim: true,
    },
    narration: {
        type: String,
        trim: true,
    },
    gstType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GST', // Reference to the GST model
        required: true,
    },
    purchaseDate: {
        type: Date,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
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