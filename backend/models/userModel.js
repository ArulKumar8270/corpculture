import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: false,
        },
        role: {
            type: Number,
            default: 0,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
        },
        commission: {
            type: Number,
            default: 0,
            min: 0,
            get: v => parseFloat(v.toFixed(2)),
            set: v => parseFloat(v.toFixed(2))
        },
        pan: {
            number: {
                type: String,
            },
            name: {
                type: String,
            },
        },
        wishlist: [{ type: mongoose.Schema.ObjectId, ref: "Product" }],
       
        
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
