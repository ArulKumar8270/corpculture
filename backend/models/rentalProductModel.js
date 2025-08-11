import mongoose from "mongoose";

// Sub-schema for A3/A4/A5 configuration
const configSchema = new mongoose.Schema({
    bwOldCount: { type: Number, default: 0 },
    freeCopiesBw: { type: Number, default: 0 },
    extraAmountBw: { type: Number, default: 0 },
    bwUnlimited: { type: Boolean, default: false },
    colorOldCount: { type: Number, default: 0 },
    freeCopiesColor: { type: Number, default: 0 },
    extraAmountColor: { type: Number, default: 0 },
    colorUnlimited: { type: Boolean, default: false },
    colorScanningOldCount: { type: Number, default: 0 },
    freeCopiesColorScanning: { type: Number, default: 0 },
    extraAmountColorScanning: { type: Number, default: 0 },
    colorScanningUnlimited: { type: Boolean, default: false },
}, { _id: false }); // _id: false to prevent Mongoose from creating _id for subdocuments

const rentalProductSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company', // Assuming you have a Company model
        required: true,
    },
    branch: {
        type: String, // Assuming branch is a string ID or name
        required: true,
        trim: true,
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee', // Assuming you have an Employee model
        required: false,
    },
    department: {
        type: String, // Assuming department is a string ID or name
        required: true,
        trim: true,
    },
    modelName: {
        type: String,
        required: true,
        trim: true,
    },
    serialNo: {
        type: String,
        required: true,
        unique: true, // Serial number should be unique
        trim: true,
    },
    hsn: {
        type: String,
        trim: true,
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0,
    },
    gstType: [{ // Changed to an array of ObjectIds
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GST', // Reference to the GST model we created earlier
        required: true,
    }],
    paymentDate: {
        type: Date,
        required: true,
    },
    modelSpecs: {
        isA3Selected: { type: Boolean, default: false },
        isA4Selected: { type: Boolean, default: false },
        isA5Selected: { type: Boolean, default: false },
    },
    a3Config: {
        type: configSchema,
        default: () => ({}), // Default to an empty object if not provided
    },
    a4Config: {
        type: configSchema,
        default: () => ({}),
    },
    a5Config: {
        type: configSchema,
        default: () => ({}),
    },
}, { timestamps: true });

export default mongoose.model('RentalProduct', rentalProductSchema);