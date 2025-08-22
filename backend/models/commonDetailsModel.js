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
}, { timestamps: true });

export default mongoose.model('CommonDetails', commonDetailsSchema);