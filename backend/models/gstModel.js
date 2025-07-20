import mongoose from "mongoose";

const gstSchema = new mongoose.Schema({
    gstType: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    gstPercentage: {
        type: Number,
        required: true,
        min: 0,
    },
}, { timestamps: true });

export default mongoose.model('GST', gstSchema);