import mongoose from "mongoose";

const commonDetailsSchema = new mongoose.Schema({
    invoiceCount: {
        type: Number,
        default: 0,
    },
    reportCount: {
        type: Number,
        default: 0,
    },
    globalInvoiceFormat: {
        type: String,
        trim: true,
    },
    fromMail: {
        type: String,
        trim: true,
    },
    petrolPricePerKm: {
        type: Number,
        default: 0,
        min: 0,
    },
}, { timestamps: true });

export default mongoose.model('CommonDetails', commonDetailsSchema);