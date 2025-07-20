import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        trim: true,
    },
    companyAddress: {
        type: String,
        required: true,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    state: {
        type: String,
        required: true,
        trim: true,
    },
    pincode: {
        type: String, // Storing as string to handle leading zeros or non-numeric formats
        required: true,
        trim: true,
    },
    gstNumber: {
        type: String,
        trim: true,
        unique: true, // GST number should be unique
        sparse: true, // Allows multiple documents to have null/undefined gstNumber
    },
    mobileNumber: {
        type: String,
        required: true,
        trim: true,
        unique: true, // Mobile number should be unique
    },
    mailId: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true, // Mail ID should be unique
        match: [/.+@.+\..+/, 'Please fill a valid email address'], // Basic email validation
    },
    personName: {
        type: String,
        required: true,
        trim: true,
    },
}, { timestamps: true });

export default mongoose.model('Vendor', vendorSchema);