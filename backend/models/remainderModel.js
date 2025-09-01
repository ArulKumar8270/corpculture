import mongoose from "mongoose";

const remainderSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company', // Reference to the Company model
        required: true,
    },
    remainderType: {
        type: String,
        required: true,
        enum: ['ServiceInvoice', 'RentalInvoice', 'SalesInvoice', 'Report', 'Quotation', 'Other'], // Example types
        trim: true,
    },
    remainderMail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address'],
    },
    ccMails: [
        {
            type: String,
            trim: true,
            lowercase: true,
            match: [/.+@.+\..+/, 'Please fill a valid email address'],
        }
    ],
    remainderDates: [
        {
            type: Number, // Represents days (e.g., 1, 2, 3 days after due date)
            required: true,
            min: 0,
        }
    ],
}, { timestamps: true });

export default mongoose.model('Remainder', remainderSchema);