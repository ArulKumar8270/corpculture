import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String, required: false },
    role: { type: Number, default: 0 },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    commission: { type: Number, default: 0, min: 0 },
    isCommissionEnabled: { type: Number, default: 0, min: 0 },
    pan: { number: { type: String }, name: { type: String } },
    wishlist: [{ type: mongoose.Schema.ObjectId, ref: "Product" }],
    department: {
        type: String,
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    // New field to store user-specific permissions
    userPermissions: {
        type: Object, // This will store the entire permissions object from your payload
        default: {}   // Default to an empty object if no permissions are set
    },
    commissionCategorys: [{ type: String }], // Added commissionCategorys field
}, { timestamps: true });

export default mongoose.model('User', userSchema);
