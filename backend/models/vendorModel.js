import mongoose from "mongoose";

const contactPersonSchema = new mongoose.Schema(
    {
        mobileNumber: { type: String, required: true, trim: true },
        mailId: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/.+@.+\..+/, "Please fill a valid email address"],
        },
        personName: { type: String, required: true, trim: true },
    },
    { _id: false }
);

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
        type: String,
        required: true,
        trim: true,
    },
    gstNumber: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
    },
    // Optional legacy fields for backward compatibility (existing vendors)
    mobileNumber: { type: String, trim: true },
    mailId: { type: String, trim: true, lowercase: true },
    personName: { type: String, trim: true },
    contactPersons: {
        type: [contactPersonSchema],
        default: [],
    },
}, { timestamps: true });

export default mongoose.model('Vendor', vendorSchema);