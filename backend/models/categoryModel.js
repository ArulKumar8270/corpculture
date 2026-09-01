import mongoose from "mongoose";
import { softDeletePlugin } from "../plugins/softDeletePlugin.js";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    commission: {
        type: Number,
        required: true,
        default: 0,
    },
}, { timestamps: true });

categorySchema.plugin(softDeletePlugin);

export default mongoose.model('Category', categorySchema);