import mongoose from "mongoose";

const rentalPaymentEntrySchema = new mongoose.Schema({
    machineId: { // Reference to the Machine model for serial number and company
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Machine',
        required: true,
    },
    companyId: { // Storing companyId directly for easier access/populating
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    sendDetailsTo: {
        type: String, // Assuming this is a string for now, could be an enum or ref to another model
        required: true,
        trim: true,
    },
    countImageUpload: {
        type: String, // URL of the uploaded image
        trim: true,
    },
    remarks: {
        type: String,
        trim: true,
    },
    a4BwOldCount: {
        type: Number,
        required: true,
    },
    a4BwNewCount: {
        type: Number,
        required: true,
    },
    entryDate: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

export default mongoose.model('RentalPaymentEntry', rentalPaymentEntrySchema);