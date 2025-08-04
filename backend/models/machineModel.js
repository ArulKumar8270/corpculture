import mongoose from "mongoose";

const machineSchema = new mongoose.Schema({
    serialNumber: {
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
    currentCount: { // This will serve as the A4 B/W Old Count
        type: Number,
        default: 0,
    },
    // You can add more machine-specific fields here if needed, e.g., model, type, etc.
}, { timestamps: true });

export default mongoose.model('Machine', machineSchema);