import mongoose from "mongoose";

const vendorProductSchema = new mongoose.Schema({
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
    gstType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GST', // Reference to the GST model
        required: true,
    },
    pricePerQuantity: {
        type: Number,
        required: true,
        min: 0,
    },
}, { timestamps: true });

// Optional: If a product name should be unique per vendor, add a compound index
// vendorProductSchema.index({ vendorCompanyName: 1, productName: 1 }, { unique: true });

export default mongoose.model('VendorProduct', vendorProductSchema);