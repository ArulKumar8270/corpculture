import mongoose from "mongoose";

const serviceProductSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company', // Assuming you have a Company model
        required: true,
    },
    productName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VendorProduct',
        trim: true,
    },
    sku: {
        type: String,
        required: true,
        unique: true, // SKU should ideally be unique
        trim: true,
    },
    hsn: {
        type: String,
        trim: true,
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
        default: 0,
    },
    commission: {
        type: Number,
        required: true,
        min: 0,
    },
    gstType: [{ // Changed to an array of ObjectIds
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GST', // Reference to the GST model we created earlier
        required: true,
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
}, { timestamps: true });

export default mongoose.model('ServiceProduct', serviceProductSchema);